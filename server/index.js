import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const app = express();

/* =========================================================
   SECURITY & MIDDLEWARE
========================================================= */

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        connectSrc: [
          "'self'",
          'http://localhost:4000',
          'http://localhost:5173',
          process.env.CLIENT_URL || 'https://hoopbook.vercel.app'
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        scriptSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

/* =========================================================
   CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT || 4000);

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hoopbook';

const JWT_SECRET =
  process.env.JWT_SECRET || 'change-this-in-production';

/* =========================================================
   ROOT / HEALTH
========================================================= */

app.get('/', (_, res) => {
  res.json({
    name: 'HoopBook API',
    status: 'running',
    frontend: process.env.CLIENT_URL || 'http://localhost:5173',
    health: '/api/health',
  });
});

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1,
  });
});

/* =========================================================
   SCHEMAS
========================================================= */

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
      index: true,
    },
    phone: String,
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    passwordHash: String,
    basketballExperience: String,
    ageGroup: String,
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

const childSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String,
    dob: String,
    basketballExperience: String,
    ageGroup: String,
  },
  {
    timestamps: true,
  }
);

const courtSchema = new mongoose.Schema(
  {
    name: String,
    address: String,
    type: String,
  },
  {
    timestamps: true,
  }
);

const slotSchema = new mongoose.Schema(
  {
    courtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Court',
    },
    date: String,
    time: String,
    coach: String,
    ageGroup: String,
    capacity: Number,
    booked: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    status: {
      type: String,
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    courtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Court',
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
    },
    playerLabel: String,
    status: {
      type: String,
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      default: 'unpaid',
    },
    fee: Number,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    amount: Number,
    currency: {
      type: String,
      default: 'SGD',
    },
    provider: {
      type: String,
      default: 'razorpay',
    },
    status: {
      type: String,
      default: 'created',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    transactionRef: String,
    submittedAt: Date,
  },
  {
    timestamps: true,
  }
);

const announcementSchema = new mongoose.Schema(
  {
    title: String,
    body: String,
    date: String,
  },
  {
    timestamps: true,
  }
);

/* =========================================================
   MODELS
========================================================= */

const User = mongoose.model('User', userSchema);
const Child = mongoose.model('Child', childSchema);
const Court = mongoose.model('Court', courtSchema);
const Slot = mongoose.model('Slot', slotSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Announcement = mongoose.model(
  'Announcement',
  announcementSchema
);

/* =========================================================
   EMAIL
========================================================= */

let transporter;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(to, subject, text, html) {
  if (!transporter || !to) return;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

/* =========================================================
   AUTH HELPERS
========================================================= */

function sign(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '8h',
    }
  );
}

function publicUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    basketballExperience: u.basketballExperience,
    ageGroup: u.ageGroup,
    language: u.language,
  };
}

function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(
      /^Bearer\s+/i,
      ''
    );

    if (!token) {
      return res
        .status(401)
        .json({ error: 'Authentication required' });
    }

    req.auth = jwt.verify(token, JWT_SECRET);

    next();
  } catch {
    res
      .status(401)
      .json({ error: 'Invalid or expired session' });
  }
}

function admin(req, res, next) {
  if (req.auth?.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Admin access required' });
  }

  next();
}

/* =========================================================
   DATABASE SEED
========================================================= */

async function seed() {
  if ((await Court.countDocuments()) === 0) {
    const next = (d) => {
      const x = new Date();
      x.setDate(x.getDate() + d);
      return x.toISOString().slice(0, 10);
    };

    const courts = await Court.insertMany([
      {
        name: 'Yishun Sports Hall — Court A',
        address: '51 Yishun Ave 11',
        type: 'Indoor',
      },
      {
        name: 'Toa Payoh ActiveSG — Court 2',
        address: '297 Lor 6 Toa Payoh',
        type: 'Outdoor',
      },
      {
        name: 'Jurong East Sports Complex',
        address: '21 Jurong East St 31',
        type: 'Indoor',
      },
    ]);

    await Slot.insertMany([
      {
        courtId: courts[0]._id,
        date: next(1),
        time: '09:00–10:30',
        coach: 'Coach Marcus',
        ageGroup: 'U12',
        capacity: 12,
        booked: [],
      },
      {
        courtId: courts[0]._id,
        date: next(1),
        time: '11:00–12:30',
        coach: 'Coach Marcus',
        ageGroup: 'U16',
        capacity: 12,
        booked: [],
      },
      {
        courtId: courts[1]._id,
        date: next(2),
        time: '16:00–17:30',
        coach: 'Coach Priya',
        ageGroup: 'Adult',
        capacity: 10,
        booked: [],
      },
      {
        courtId: courts[2]._id,
        date: next(3),
        time: '18:00–19:30',
        coach: 'Coach Wei',
        ageGroup: 'U12',
        capacity: 12,
        booked: [],
      },
    ]);
  }

  if ((await Announcement.countDocuments()) === 0) {
    await Announcement.create({
      title: 'Welcome to HoopBook',
      body: 'Register, pick a slot, and get on court this week.',
      date: new Date().toISOString().slice(0, 10),
    });
  }

  if (!(await User.findOne({ role: 'admin' }))) {
    await User.create({
      name: 'HoopBook Admin',
      email:
        process.env.ADMIN_EMAIL || 'admin@hoopbook.local',
      phone: '90000000',
      role: 'admin',
      passwordHash: await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'Admin@123',
        12
      ),
    });
  }
}

/* =========================================================
   AUTH ROUTES
========================================================= */

app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      accountType = 'player',
      language = 'en',
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email and password are required.',
      });
    }

    if (
      await User.findOne({
        email: email.toLowerCase(),
      })
    ) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone,
      role: 'customer',
      language,
      passwordHash: await bcrypt.hash(password, 12),
    });

    res.json({
      token: sign(user),
      user: publicUser(user),
      accountType,
    });
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({
      email: String(req.body.email || '')
        .toLowerCase()
        .trim(),
    });

    if (
      !user ||
      !(await bcrypt.compare(
        req.body.password || '',
        user.passwordHash
      ))
    ) {
      return res.status(401).json({
        error: 'Incorrect email or password.',
      });
    }

    res.json({
      token: sign(user),
      user: publicUser(user),
    });
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  const u = await User.findById(req.auth.sub);

  if (!u) {
    return res.status(401).json({
      error: 'User not found',
    });
  }

  res.json({
    user: publicUser(u),
  });
});

app.patch('/api/profile', auth, async (req, res) => {
  const u = await User.findByIdAndUpdate(
    req.auth.sub,
    {
      $set: {
        name: req.body.name,
        phone: req.body.phone,
        basketballExperience:
          req.body.basketballExperience,
        ageGroup: req.body.ageGroup,
        language: req.body.language,
      },
    },
    {
      new: true,
    }
  );

  res.json({
    user: publicUser(u),
  });
});

/* =========================================================
   PUBLIC ROUTES
========================================================= */

app.get('/api/courts', async (_, res) => {
  res.json({
    courts: await Court.find().lean(),
  });
});

app.get('/api/slots', async (_, res) => {
  res.json({
    slots: await Slot.find().lean(),
  });
});

app.get('/api/announcements', async (_, res) => {
  res.json({
    announcements: await Announcement.find()
      .sort({ createdAt: -1 })
      .lean(),
  });
});

/* =========================================================
   CHILDREN
========================================================= */

app.get('/api/children', auth, async (req, res) => {
  res.json({
    children: await Child.find({
      parentId: req.auth.sub,
    }).lean(),
  });
});

app.post('/api/children', auth, async (req, res) => {
  res.status(201).json({
    child: await Child.create({
      ...req.body,
      parentId: req.auth.sub,
    }),
  });
});

/* =========================================================
   BOOKINGS
========================================================= */

app.get('/api/bookings', auth, async (req, res) => {
  const requests = await Booking.find({
    userId: req.auth.sub,
  })
    .sort({ createdAt: -1 })
    .lean();

  const payments = await Payment.find({
    userId: req.auth.sub,
  }).lean();

  res.json({
    requests,
    payments,
  });
});

app.post('/api/bookings', auth, async (req, res) => {
  try {
    const slot = await Slot.findById(req.body.slotId).populate(
      'courtId'
    );

    if (!slot) {
      return res.status(404).json({
        error: 'Slot not found',
      });
    }

    const full = slot.booked.length >= slot.capacity;

    const booking = await Booking.create({
      userId: req.auth.sub,
      courtId: slot.courtId._id,
      slotId: slot._id,
      playerLabel: req.body.playerLabel,
      status: full ? 'waitlisted' : 'pending',
      paymentStatus: 'unpaid',
    });

    slot.booked.push(booking._id);
    await slot.save();

    const user = await User.findById(req.auth.sub);

    await sendEmail(
      user.email,
      'HoopBook booking request received',
      `Your booking request for ${slot.courtId.name} on ${slot.date} ${slot.time} was received. Status: ${booking.status}.`,
      `<h2>HoopBook</h2>
       <p>Your booking request for <b>${slot.courtId.name}</b> on ${slot.date} ${slot.time} was received.</p>
       <p>Status: <b>${booking.status}</b></p>`
    );

    res.status(201).json({
      request: booking,
    });
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

/* =========================================================
   ADMIN ROUTES
========================================================= */

app.post(
  '/api/admin/courts',
  auth,
  admin,
  async (req, res) => {
    res.status(201).json({
      court: await Court.create({
        name: req.body.name,
        address: req.body.address,
        type: req.body.type,
      }),
    });
  }
);

app.post(
  '/api/admin/slots',
  auth,
  admin,
  async (req, res) => {
    const slot = await Slot.create({
      courtId: req.body.courtId,
      date: req.body.date,
      time: req.body.time,
      coach: req.body.coach,
      ageGroup: req.body.ageGroup,
      capacity: Number(req.body.capacity) || 10,
      booked: [],
      status: 'open',
    });

    res.status(201).json({
      slot,
    });
  }
);

app.patch(
  '/api/admin/slots/:id',
  auth,
  admin,
  async (req, res) => {
    res.json({
      slot: await Slot.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        {
          new: true,
        }
      ),
    });
  }
);

app.get(
  '/api/admin/overview',
  auth,
  admin,
  async (_, res) => {
    res.json({
      userCount: await User.countDocuments({
        role: 'customer',
      }),
    });
  }
);

app.get(
  '/api/admin/bookings',
  auth,
  admin,
  async (_, res) => {
    res.json({
      requests: await Booking.find()
        .sort({ createdAt: -1 })
        .lean(),
    });
  }
);

app.patch(
  '/api/admin/bookings/:id',
  auth,
  admin,
  async (req, res) => {
    const b = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      {
        new: true,
      }
    );

    if (!b) {
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    const user = await User.findById(b.userId);

    const slot = await Slot.findById(b.slotId).populate(
      'courtId'
    );

    if (user) {
      await sendEmail(
        user.email,
        `HoopBook booking ${b.status}`,
        `Your booking for ${slot?.courtId?.name || 'court'} on ${slot?.date || ''} ${slot?.time || ''} is now ${b.status}. ${
          b.fee ? `Fee: SGD ${b.fee}.` : ''
        }`,
        `<h2>HoopBook booking update</h2>
         <p>Your booking is now <b>${b.status}</b>.</p>
         ${
           b.fee
             ? `<p>Fee: <b>SGD ${b.fee}</b></p>`
             : ''
         }`
      );
    }

    res.json({
      request: b,
    });
  }
);

/* =========================================================
   RAZORPAY
========================================================= */

const razorpay =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

app.post(
  '/api/payments/order',
  auth,
  async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(503).json({
          error:
            'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
        });
      }

      const b = await Booking.findOne({
        _id: req.body.requestId,
        userId: req.auth.sub,
      });

      if (!b || b.status !== 'approved') {
        return res.status(400).json({
          error: 'Booking is not approved for payment.',
        });
      }

      const amount = Number(b.fee || 25);

      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'SGD',
        receipt: `hb_${b._id}`,
        notes: {
          bookingId: String(b._id),
        },
      });

      const p = await Payment.create({
        userId: req.auth.sub,
        requestId: b._id,
        amount,
        currency: 'SGD',
        provider: 'razorpay',
        status: 'created',
        razorpayOrderId: order.id,
      });

      res.json({
        orderId: order.id,
        paymentId: String(p._id),
        amount,
        currency: 'SGD',
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (e) {
      res.status(500).json({
        error: e.error?.description || e.message,
      });
    }
  }
);

app.post(
  '/api/payments/verify',
  auth,
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        requestId,
      } = req.body;

      const expected = crypto
        .createHmac(
          'sha256',
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest('hex');

      if (expected !== razorpay_signature) {
        return res.status(400).json({
          error: 'Payment signature verification failed.',
        });
      }

      const p = await Payment.findOneAndUpdate(
        {
          razorpayOrderId: razorpay_order_id,
          userId: req.auth.sub,
        },
        {
          $set: {
            status: 'verified',
            razorpayPaymentId: razorpay_payment_id,
            transactionRef: razorpay_payment_id,
            submittedAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

      const b = await Booking.findOneAndUpdate(
        {
          _id: requestId,
          userId: req.auth.sub,
        },
        {
          $set: {
            paymentStatus: 'verified',
          },
        },
        {
          new: true,
        }
      );

      const user = await User.findById(req.auth.sub);

      const slot = await Slot.findById(b.slotId).populate(
        'courtId'
      );

      await sendEmail(
        user.email,
        'HoopBook payment confirmed',
        `Payment received for ${slot.courtId.name} on ${slot.date} ${slot.time}. Amount: SGD ${p.amount}. Payment ID: ${razorpay_payment_id}.`,
        `<h2>HoopBook payment confirmed</h2>
         <p>Amount: <b>SGD ${p.amount}</b></p>
         <p>Payment ID: ${razorpay_payment_id}</p>
         <p>${slot.courtId.name} · ${slot.date} · ${slot.time}</p>`
      );

      res.json({
        payment: p,
        request: b,
      });
    } catch (e) {
      res.status(500).json({
        error: e.message,
      });
    }
  }
);

app.get(
  '/api/admin/payments',
  auth,
  admin,
  async (_, res) => {
    res.json({
      payments: await Payment.find()
        .sort({ createdAt: -1 })
        .lean(),
      requests: await Booking.find().lean(),
    });
  }
);

app.patch(
  '/api/admin/payments/:id',
  auth,
  admin,
  async (req, res) => {
    const p = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: req.body.status,
        },
      },
      {
        new: true,
      }
    );

    if (!p) {
      return res.status(404).json({
        error: 'Payment not found',
      });
    }

    await Booking.findByIdAndUpdate(
      p.requestId,
      {
        $set: {
          paymentStatus:
            req.body.status === 'verified'
              ? 'verified'
              : 'rejected',
        },
      }
    );

    res.json({
      payment: p,
    });
  }
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: 'Internal server error',
  });
});

/* =========================================================
   START SERVER
========================================================= */

mongoose.connect(MONGO_URI)
  .then(async () => {
    await seed();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`HoopBook API running on port ${PORT}`);
    });
  })
  .catch(e => {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  });