const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator/check');
const Event = require('../../models/Event');
const { adminAuth } = require('../../middleware/auth');

// @route   GET api/events/index
// @desc    Get events on index page
// @access  Public
router.get('/index', async (req, res) => {
  try {
    let school = req.query.school;
    let tags = req.query.tags;
    let featured = req.query.featured === 'true';
    let limit = parseInt(req.query.limit, 10);
    const dateNow = new Date();

    let events;

    if (school && tags) {
      events = await Event.find({
        school,
        tags,
        featured,
        'date.from': { $gte: new Date(dateNow.toISOString()) }
      })
        .sort({
          'date.from': 1
        })
        .limit(limit);
    } else if (school) {
      events = await Event.find({
        school,
        featured,
        'date.from': { $gte: new Date(dateNow.toISOString()) }
      })
        .sort({ 'date.from': 1 })
        .limit(limit);
    } else if (tags) {
      events = await Event.find({
        tags,
        featured,
        'date.from': { $gte: new Date(dateNow.toISOString()) }
      })
        .sort({ 'date.from': 1 })
        .limit(limit);
    } else {
      events = await Event.find({
        featured,
        'date.from': { $gte: new Date(dateNow.toISOString()) }
      })
        .sort({ 'date.from': 1 })
        .limit(limit);
    }

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/events
// @desc    Get events on explore events page
// @access  Public
router.get('/', async (req, res) => {
  try {
    let school = req.query.school;
    let tags = req.query.tags !== '' ? req.query.tags.split(',') : null;
    let featured = req.query.featured ? req.query.featured === 'true' : null;

    let events;

    const dateNow = new Date();

    if (featured !== null) {
      if (school && tags) {
        events = await Event.find({
          school,
          featured,
          tags: { $in: tags },
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({
          'date.from': 1
        });
      } else if (school) {
        events = await Event.find({
          school,
          featured,
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({
          'date.from': 1
        });
      } else if (tags) {
        events = await Event.find({
          tags: { $in: tags },
          featured,
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({
          'date.from': 1
        });
      } else {
        events = await Event.find({
          featured,
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({ 'date.from': 1 });
      }
    } else {
      if (school && tags) {
        events = await Event.find({
          school,
          tags: { $in: tags },
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({
          'date.from': 1
        });
      } else if (school) {
        events = await Event.find({
          school,
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({ 'date.from': 1 });
      } else if (tags) {
        events = await Event.find({
          tags: { $in: tags },
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({
          'date.from': 1
        });
      } else {
        events = await Event.find({
          'date.from': { $gte: new Date(dateNow.toISOString()) }
        }).sort({ 'date.from': 1 });
      }
    }

    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/events/:id
// @desc    Get events by id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/events/feature/:id
// @desc    Update feature status of an event
// @access  Admin
router.put('/feature/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Toggle featured
    event.featured = !event.featured;
    await event.save();

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/events
// @desc    Create a NORMAL or FEATURED event
// @access  Admin
router.post(
  '/',
  [
    adminAuth,
    check('title', 'Title is required')
      .not()
      .isEmpty(),
    check('description', 'Description is requried')
      .not()
      .isEmpty(),
    check('date.from', "Invalid 'from' date format").isISO8601(),
    check('date.to', "Invalid 'to' date format").isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      location,
      date,
      description,
      thumbnailUrl,
      school,
      featured,
      tags,
      rsvpLink
    } = req.body;

    const eventFields = {
      title,
      location,
      date,
      description,
      thumbnailUrl,
      school,
      featured,
      tags,
      rsvpLink
    };

    try {
      const event = new Event(eventFields);
      event = await event.save();
      res.json(event);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/events/test-data
// @desc    Generate fake data
// @access  Developer

/**
 * DELETE LATER
 */
router.get('/test/generate-test-data', async (req, res) => {
  const random = () => Math.random() * 0.01 - 0.005;

  try {
    // Remove all existing data
    await Event.deleteMany();

    let saveCoord = {};
    // Fake events
    for (let i = 0; i < 18; i++) {
      let title, school;
      if (i < 6) {
        title = 'Dornsife Event';
        school = 'dornsife';
      } else {
        title = 'Viterbi Event';
        school = 'viterbi';
      }

      let lat = 34.02176870202642 + random();
      let lng = -118.28651879471587 + random();

      if (i == 0) {
        saveCoord = { lat, lng };
      } else if (i < 4) {
        lat = saveCoord.lat;
        lng = saveCoord.lng;
      }
      console.log({ i, lat, lng });
      let newEvent = {
        title: `${title} ${i + 1}`,
        location: {
          room: 'Taper Hall 112',
          address: '1015 W 34st, LA 90089',
          latitude: lat,
          longitude: lng
        },
        date: {
          from: new Date(
            `${i + 1 < 10 ? `0${i + 1}` : i + 1} July 2019 4:30:00 PDT`
          ),
          to: new Date(
            `${i + 1 < 10 ? `0${i + 1}` : i + 1}  July 2019 6:30:00 PDT`
          ),
          multiDay: false
        },
        featured: false,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        thumbnailUrl: 'https://dummyimage.com/600x400/000/fff',
        school,
        tags: ['WORKSHOP', 'CAREER']
      };
      newEvent = new Event(newEvent);
      newEvent = await newEvent.save();
      console.log({ i, school });
    }

    // Fake featured events
    for (let i = 0; i < 16; i++) {
      let title, school;
      if (i < 4) {
        title = 'Featured Viterbi Event';
        school = 'viterbi';
      } else if (i < 8) {
        title = 'Featured Dornsife Event';
        school = 'dornsife';
      } else if (i < 12) {
        title = 'Featured Annenberg Event';
        school = 'annenberg';
      } else {
        title = 'Featured Marshall Event';
        school = 'marshall';
      }
      let newEvent = {
        title: `${title} ${i + 1}`,
        location: {
          room: 'Taper Hall 112',
          address: '1015 W 34st, LA 90089',
          latitude: 34.02176870202642 + random(),
          longitude: -118.28651879471587 + random()
        },
        date: {
          from: new Date(`${i + 10} July 2019 4:30:00 PDT`),
          to: new Date(`${i + 10} July 2019 6:30:00 PDT`),
          multiDay: false
        },
        featured: true,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        thumbnailUrl: 'https://dummyimage.com/600x400/000/fff',
        school,
        tags: ['WORKSHOP', 'CAREER']
      };
      newEvent = new Event(newEvent);
      newEvent = await newEvent.save();
      console.log({ i: i + 24, school });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
