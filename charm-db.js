/* ─── Charm Database Layer ────────────────────────────────────────────────
 *  Abstraction over localStorage (demo) or Supabase (production).
 *  To switch to Supabase, set window.CHARM_CONFIG before this script loads:
 *
 *    window.CHARM_CONFIG = {
 *      supabaseUrl: 'https://xxx.supabase.co',
 *      supabaseKey: 'your-anon-key'
 *    };
 *
 *  Without config, everything runs on localStorage — perfect for GitHub Pages demo.
 * ──────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const CFG = window.CHARM_CONFIG || {};
  const USE_SUPABASE = !!(CFG.supabaseUrl && CFG.supabaseKey);

  // ═══════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════════════
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function now() { return new Date().toISOString(); }

  // ═══════════════════════════════════════════════════════════════════════
  //  CATEGORIES — the Charm taxonomy (single source of truth)
  // ═══════════════════════════════════════════════════════════════════════
  const CATEGORIES = [
    { slug: 'music-studios', label: 'Music Studios', emoji: '🎧',
      tagline: 'Production, recording, rehearsal, instruments',
      subs: [
        { slug: 'production', label: 'Production' },
        { slug: 'recording', label: 'Recording' },
        { slug: 'rehearsal', label: 'Rehearsal' },
        { slug: 'instruments', label: 'Instruments' },
      ] },
    { slug: 'podcast-studios', label: 'Podcast Studios', emoji: '🎙',
      tagline: 'Audio, microphones, software, acoustics',
      subs: [
        { slug: 'audio', label: 'Audio' },
        { slug: 'microphones', label: 'Microphones' },
        { slug: 'software', label: 'Software' },
        { slug: 'acoustics', label: 'Acoustics' },
      ] },
    { slug: 'photography-studios', label: 'Photography Studios', emoji: '📷',
      tagline: 'Fashion, product, portrait, white cyclorama',
      subs: [
        { slug: 'fashion', label: 'Fashion' },
        { slug: 'product', label: 'Product' },
        { slug: 'portrait', label: 'Portrait' },
        { slug: 'cyclorama', label: 'White Cyclorama' },
      ] },
    { slug: 'rehearsal-theater', label: 'Rehearsal / Theater', emoji: '🎭',
      tagline: 'Theater, dance, singing, performance',
      subs: [
        { slug: 'theater', label: 'Theater' },
        { slug: 'dance', label: 'Dance' },
        { slug: 'singing', label: 'Singing' },
        { slug: 'performance', label: 'Performance' },
      ] },
    { slug: 'art-spaces', label: 'Art Spaces', emoji: '🎨',
      tagline: 'Galleries, exhibitions, ateliers, residencies',
      subs: [
        { slug: 'galleries', label: 'Galleries' },
        { slug: 'exhibitions', label: 'Exhibitions' },
        { slug: 'ateliers', label: 'Ateliers' },
        { slug: 'residencies', label: 'Residencies' },
      ] },
    { slug: 'dance-studios', label: 'Dance Studios', emoji: '💃',
      tagline: 'Hip hop, contemporary, ballet, zumba',
      subs: [
        { slug: 'hip-hop', label: 'Hip Hop' },
        { slug: 'contemporary', label: 'Contemporary' },
        { slug: 'ballet', label: 'Ballet' },
        { slug: 'zumba', label: 'Zumba' },
      ] },
    { slug: 'training', label: 'Training', emoji: '🎓',
      tagline: 'Music, audiovisual, dance, and photography courses',
      subs: [
        { slug: 'music', label: 'Music' },
        { slug: 'audiovisual', label: 'Audiovisual' },
        { slug: 'dance', label: 'Dance' },
        { slug: 'photography', label: 'Photography' },
      ] },
    { slug: 'professionals', label: 'Professionals', emoji: '🛠',
      tagline: 'Videographers, photographers, designers, producers',
      subs: [
        { slug: 'videographers', label: 'Videographers' },
        { slug: 'photographers', label: 'Photographers' },
        { slug: 'designers', label: 'Designers' },
        { slug: 'producers', label: 'Producers' },
      ] },
    { slug: 'marketplace', label: 'Marketplace', emoji: '🛍',
      tagline: 'Audiovisual equipment, instruments, merchandising, decor',
      subs: [
        { slug: 'equipment', label: 'Audiovisual Equipment' },
        { slug: 'instruments', label: 'Instruments' },
        { slug: 'merch', label: 'Merchandising' },
        { slug: 'decor', label: 'Creative Decor' },
      ] },
    { slug: 'events-venues', label: 'Events / Unique Venues', emoji: '🎪',
      tagline: 'Retreat houses, rooftops, farms, exotic locations',
      subs: [
        { slug: 'retreats', label: 'Retreat Houses' },
        { slug: 'rooftops', label: 'Rooftops' },
        { slug: 'farms', label: 'Farms' },
        { slug: 'exotic', label: 'Exotic Locations' },
      ] },
    { slug: 'tattoo-artists', label: 'Tattoo Artists', emoji: '🖌',
      tagline: 'Traditional, realism, blackwork, minimal',
      subs: [
        { slug: 'traditional', label: 'Traditional' },
        { slug: 'realism', label: 'Realism' },
        { slug: 'blackwork', label: 'Blackwork' },
        { slug: 'minimal', label: 'Minimal' },
      ] },
  ];

  const Categories = {
    all() { return CATEGORIES; },
    bySlug(slug) { return CATEGORIES.find(c => c.slug === slug) || null; },
    labelFor(slug) { const c = this.bySlug(slug); return c ? c.label : slug; },
    subLabelFor(catSlug, subSlug) {
      const c = this.bySlug(catSlug);
      if (!c) return subSlug;
      const s = c.subs.find(s => s.slug === subSlug);
      return s ? s.label : subSlug;
    },
  };

  function store(key) {
    return {
      get() { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
      set(data) { localStorage.setItem(key, JSON.stringify(data)); },
      getObj() { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } },
      setObj(data) { localStorage.setItem(key, JSON.stringify(data)); }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  AUTH
  // ═══════════════════════════════════════════════════════════════════════
  const AUTH_KEY = 'charm-auth';
  const USERS_KEY = 'charm-users';

  const Auth = {
    /** Get current logged-in user or null */
    currentUser() {
      const session = store(AUTH_KEY).getObj();
      return session.user || null;
    },

    /** Sign up with email + password + display name */
    async signUp({ email, password, name }) {
      if (!email || !password || !name) throw new Error('All fields required');
      const users = store(USERS_KEY).get();
      if (users.find(u => u.email === email.toLowerCase())) {
        throw new Error('An account with this email already exists');
      }
      const user = {
        id: uuid(),
        email: email.toLowerCase(),
        password: btoa(password), // simple encoding for demo — NOT secure
        name,
        avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        bio: '',
        location: '',
        joined: now(),
        verified: false,
        rating: 0,
        reviewCount: 0,
        listingCount: 0,
        bookingCount: 0,
      };
      users.push(user);
      store(USERS_KEY).set(users);
      const safeUser = { ...user };
      delete safeUser.password;
      store(AUTH_KEY).setObj({ user: safeUser, loggedInAt: now() });
      window.dispatchEvent(new CustomEvent('charm:auth-change', { detail: safeUser }));
      return safeUser;
    },

    /** Log in with email + password */
    async login({ email, password }) {
      const users = store(USERS_KEY).get();
      const user = users.find(u => u.email === email.toLowerCase());
      if (!user || user.password !== btoa(password)) {
        throw new Error('Invalid email or password');
      }
      const safeUser = { ...user };
      delete safeUser.password;
      store(AUTH_KEY).setObj({ user: safeUser, loggedInAt: now() });
      window.dispatchEvent(new CustomEvent('charm:auth-change', { detail: safeUser }));
      return safeUser;
    },

    /** Log out */
    logout() {
      localStorage.removeItem(AUTH_KEY);
      window.dispatchEvent(new CustomEvent('charm:auth-change', { detail: null }));
    },

    /** Update profile fields */
    async updateProfile(updates) {
      const user = this.currentUser();
      if (!user) throw new Error('Not logged in');
      const users = store(USERS_KEY).get();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1) throw new Error('User not found');
      // Only allow safe fields
      const allowed = ['name', 'bio', 'location', 'avatar', 'portfolio'];
      allowed.forEach(k => { if (updates[k] !== undefined) users[idx][k] = updates[k]; });
      store(USERS_KEY).set(users);
      const safeUser = { ...users[idx] };
      delete safeUser.password;
      store(AUTH_KEY).setObj({ user: safeUser, loggedInAt: now() });
      window.dispatchEvent(new CustomEvent('charm:auth-change', { detail: safeUser }));
      return safeUser;
    },

    /** Get user by ID */
    getUser(id) {
      const users = store(USERS_KEY).get();
      const user = users.find(u => u.id === id);
      if (!user) return null;
      const safe = { ...user };
      delete safe.password;
      return safe;
    },

    /** Check if logged in */
    isLoggedIn() {
      return !!this.currentUser();
    },

    /** Listen for auth changes */
    onChange(callback) {
      window.addEventListener('charm:auth-change', e => callback(e.detail));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  LISTINGS
  // ═══════════════════════════════════════════════════════════════════════
  const LISTINGS_KEY = 'charm-listings';

  const Listings = {
    /** Create a new listing */
    async create(data) {
      const user = Auth.currentUser();
      if (!user) throw new Error('Must be logged in to create a listing');
      const listing = {
        id: uuid(),
        sellerId: user.id,
        sellerName: user.name,
        sellerAvatar: user.avatar,
        title: data.title,
        description: data.description || '',
        category: data.category || 'marketplace',
        subcategory: data.subcategory || '',
        condition: data.condition || 'excellent',
        type: data.type || 'rent', // rent | buy | both
        priceRent: parseFloat(data.priceRent) || 0,   // per day
        priceBuy: parseFloat(data.priceBuy) || 0,
        deposit: parseFloat(data.deposit) || 0,
        location: data.location || user.location || '',
        images: data.images || [],  // array of data URLs or paths
        tags: data.tags || [],
        availability: data.availability || 'available', // available | booked | unavailable
        bookedDates: [],  // array of { start, end, bookerId }
        rating: 0,
        reviewCount: 0,
        views: 0,
        featured: false,
        createdAt: now(),
        updatedAt: now(),
      };
      const listings = store(LISTINGS_KEY).get();
      listings.unshift(listing);
      store(LISTINGS_KEY).set(listings);

      // Update user listing count
      const users = store(USERS_KEY).get();
      const uIdx = users.findIndex(u => u.id === user.id);
      if (uIdx > -1) { users[uIdx].listingCount = (users[uIdx].listingCount || 0) + 1; store(USERS_KEY).set(users); }

      window.dispatchEvent(new CustomEvent('charm:listing-created', { detail: listing }));
      return listing;
    },

    /** Get all listings with optional filters */
    async getAll(filters = {}) {
      let listings = store(LISTINGS_KEY).get();

      if (filters.category && filters.category !== 'all') {
        listings = listings.filter(l => l.category === filters.category);
      }
      if (filters.subcategory && filters.subcategory !== 'all') {
        listings = listings.filter(l => l.subcategory === filters.subcategory);
      }
      if (filters.type && filters.type !== 'all') {
        listings = listings.filter(l => l.type === filters.type || l.type === 'both');
      }
      if (filters.minPrice !== undefined) {
        listings = listings.filter(l => (l.priceRent || l.priceBuy) >= filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        listings = listings.filter(l => {
          const price = l.type === 'buy' ? l.priceBuy : l.priceRent;
          return price <= filters.maxPrice;
        });
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        listings = listings.filter(l =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      if (filters.sellerId) {
        listings = listings.filter(l => l.sellerId === filters.sellerId);
      }
      if (filters.condition) {
        listings = listings.filter(l => l.condition === filters.condition);
      }
      if (filters.location) {
        const loc = filters.location.toLowerCase();
        listings = listings.filter(l => l.location.toLowerCase().includes(loc));
      }

      // Sort
      const sort = filters.sort || 'newest';
      if (sort === 'newest') listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      else if (sort === 'price-low') listings.sort((a, b) => (a.priceRent || a.priceBuy) - (b.priceRent || b.priceBuy));
      else if (sort === 'price-high') listings.sort((a, b) => (b.priceRent || b.priceBuy) - (a.priceRent || a.priceBuy));
      else if (sort === 'rating') listings.sort((a, b) => b.rating - a.rating);

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const start = (page - 1) * limit;
      return {
        listings: listings.slice(start, start + limit),
        total: listings.length,
        page,
        totalPages: Math.ceil(listings.length / limit)
      };
    },

    /** Get a single listing by ID */
    async getById(id) {
      const listings = store(LISTINGS_KEY).get();
      const listing = listings.find(l => l.id === id);
      if (listing) {
        // Increment views
        listing.views = (listing.views || 0) + 1;
        store(LISTINGS_KEY).set(listings);
      }
      return listing || null;
    },

    /** Update a listing (owner only) */
    async update(id, updates) {
      const user = Auth.currentUser();
      if (!user) throw new Error('Must be logged in');
      const listings = store(LISTINGS_KEY).get();
      const idx = listings.findIndex(l => l.id === id);
      if (idx === -1) throw new Error('Listing not found');
      if (listings[idx].sellerId !== user.id) throw new Error('Not authorized');
      const allowed = ['title', 'description', 'category', 'condition', 'type', 'priceRent', 'priceBuy', 'deposit', 'location', 'images', 'tags', 'availability'];
      allowed.forEach(k => { if (updates[k] !== undefined) listings[idx][k] = updates[k]; });
      listings[idx].updatedAt = now();
      store(LISTINGS_KEY).set(listings);
      return listings[idx];
    },

    /** Delete a listing (owner only) */
    async remove(id) {
      const user = Auth.currentUser();
      if (!user) throw new Error('Must be logged in');
      const listings = store(LISTINGS_KEY).get();
      const idx = listings.findIndex(l => l.id === id);
      if (idx === -1) throw new Error('Listing not found');
      if (listings[idx].sellerId !== user.id) throw new Error('Not authorized');
      listings.splice(idx, 1);
      store(LISTINGS_KEY).set(listings);
      return true;
    },

    /** Get listings by current user */
    async mine() {
      const user = Auth.currentUser();
      if (!user) return [];
      const all = store(LISTINGS_KEY).get();
      return all.filter(l => l.sellerId === user.id);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  BOOKINGS
  // ═══════════════════════════════════════════════════════════════════════
  const BOOKINGS_KEY = 'charm-bookings';

  const Bookings = {
    /** Create a booking */
    async create({ listingId, startDate, endDate, message }) {
      const user = Auth.currentUser();
      if (!user) throw new Error('Must be logged in to book');

      const listing = await Listings.getById(listingId);
      if (!listing) throw new Error('Listing not found');
      if (listing.sellerId === user.id) throw new Error('Cannot book your own listing');

      // Check date availability
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) throw new Error('End date must be after start date');

      const conflict = (listing.bookedDates || []).some(b => {
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return start < bEnd && end > bStart;
      });
      if (conflict) throw new Error('These dates are already booked');

      // Calculate total
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const total = days * (listing.priceRent || 0);

      const booking = {
        id: uuid(),
        listingId,
        listingTitle: listing.title,
        listingImage: listing.images[0] || '',
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        bookerId: user.id,
        bookerName: user.name,
        bookerAvatar: user.avatar,
        startDate: startDate,
        endDate: endDate,
        days,
        pricePerDay: listing.priceRent || 0,
        total,
        deposit: listing.deposit || 0,
        message: message || '',
        status: 'pending', // pending | confirmed | declined | cancelled | completed
        createdAt: now(),
        updatedAt: now(),
      };

      const bookings = store(BOOKINGS_KEY).get();
      bookings.unshift(booking);
      store(BOOKINGS_KEY).set(bookings);

      // Add booked dates to listing
      const listings = store(LISTINGS_KEY).get();
      const lIdx = listings.findIndex(l => l.id === listingId);
      if (lIdx > -1) {
        if (!listings[lIdx].bookedDates) listings[lIdx].bookedDates = [];
        listings[lIdx].bookedDates.push({ start: startDate, end: endDate, bookerId: user.id, bookingId: booking.id });
        store(LISTINGS_KEY).set(listings);
      }

      // Create notification for seller
      Notifications.create({
        userId: listing.sellerId,
        type: 'booking_request',
        title: 'New booking request',
        message: `${user.name} wants to book "${listing.title}" for ${days} day${days > 1 ? 's' : ''}`,
        link: `dashboard.html?tab=bookings&id=${booking.id}`,
        data: { bookingId: booking.id }
      });

      window.dispatchEvent(new CustomEvent('charm:booking-created', { detail: booking }));
      return booking;
    },

    /** Get bookings for current user (as booker) */
    async myBookings() {
      const user = Auth.currentUser();
      if (!user) return [];
      return store(BOOKINGS_KEY).get().filter(b => b.bookerId === user.id);
    },

    /** Get bookings for current user's listings (as seller) */
    async incomingBookings() {
      const user = Auth.currentUser();
      if (!user) return [];
      return store(BOOKINGS_KEY).get().filter(b => b.sellerId === user.id);
    },

    /** Update booking status (seller can confirm/decline, booker can cancel) */
    async updateStatus(bookingId, status) {
      const user = Auth.currentUser();
      if (!user) throw new Error('Must be logged in');

      const bookings = store(BOOKINGS_KEY).get();
      const idx = bookings.findIndex(b => b.id === bookingId);
      if (idx === -1) throw new Error('Booking not found');

      const booking = bookings[idx];
      const isSeller = booking.sellerId === user.id;
      const isBooker = booking.bookerId === user.id;

      if (status === 'confirmed' && !isSeller) throw new Error('Only the seller can confirm');
      if (status === 'declined' && !isSeller) throw new Error('Only the seller can decline');
      if (status === 'cancelled' && !isBooker) throw new Error('Only the booker can cancel');

      bookings[idx].status = status;
      bookings[idx].updatedAt = now();
      store(BOOKINGS_KEY).set(bookings);

      // Remove booked dates if declined or cancelled
      if (status === 'declined' || status === 'cancelled') {
        const listings = store(LISTINGS_KEY).get();
        const lIdx = listings.findIndex(l => l.id === booking.listingId);
        if (lIdx > -1) {
          listings[lIdx].bookedDates = (listings[lIdx].bookedDates || []).filter(d => d.bookingId !== bookingId);
          store(LISTINGS_KEY).set(listings);
        }
      }

      // Notify the other party
      const notifyUser = isSeller ? booking.bookerId : booking.sellerId;
      const statusMsg = { confirmed: 'confirmed', declined: 'declined', cancelled: 'cancelled' };
      Notifications.create({
        userId: notifyUser,
        type: `booking_${status}`,
        title: `Booking ${statusMsg[status]}`,
        message: `Booking for "${booking.listingTitle}" has been ${statusMsg[status]}`,
        link: `dashboard.html?tab=bookings&id=${bookingId}`,
        data: { bookingId }
      });

      return bookings[idx];
    },

    /** Get a single booking */
    async getById(id) {
      return store(BOOKINGS_KEY).get().find(b => b.id === id) || null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════
  const NOTIF_KEY = 'charm-notifications';

  const Notifications = {
    create({ userId, type, title, message, link, data }) {
      const notifs = store(NOTIF_KEY).get();
      notifs.unshift({
        id: uuid(),
        userId,
        type,
        title,
        message,
        link: link || '',
        data: data || {},
        read: false,
        createdAt: now()
      });
      store(NOTIF_KEY).set(notifs);
      window.dispatchEvent(new CustomEvent('charm:notification', { detail: { userId, type, title } }));
    },

    /** Get notifications for current user */
    forCurrentUser() {
      const user = Auth.currentUser();
      if (!user) return [];
      return store(NOTIF_KEY).get().filter(n => n.userId === user.id);
    },

    /** Unread count */
    unreadCount() {
      return this.forCurrentUser().filter(n => !n.read).length;
    },

    /** Mark as read */
    markRead(id) {
      const notifs = store(NOTIF_KEY).get();
      const n = notifs.find(n => n.id === id);
      if (n) { n.read = true; store(NOTIF_KEY).set(notifs); }
    },

    /** Mark all as read */
    markAllRead() {
      const user = Auth.currentUser();
      if (!user) return;
      const notifs = store(NOTIF_KEY).get();
      notifs.forEach(n => { if (n.userId === user.id) n.read = true; });
      store(NOTIF_KEY).set(notifs);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  REVIEWS
  // ═══════════════════════════════════════════════════════════════════════
  const REVIEWS_KEY = 'charm-reviews';

  const Reviews = {
    async create({ listingId, rating, text }) {
      const user = Auth.currentUser();
      if (!user) throw new Error('Must be logged in');
      if (rating < 1 || rating > 5) throw new Error('Rating must be 1-5');

      const listing = await Listings.getById(listingId);
      if (!listing) throw new Error('Listing not found');

      const review = {
        id: uuid(),
        listingId,
        sellerId: listing.sellerId,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerAvatar: user.avatar,
        rating,
        text: text || '',
        createdAt: now()
      };

      const reviews = store(REVIEWS_KEY).get();
      reviews.unshift(review);
      store(REVIEWS_KEY).set(reviews);

      // Update listing rating
      const listingReviews = reviews.filter(r => r.listingId === listingId);
      const avgRating = listingReviews.reduce((s, r) => s + r.rating, 0) / listingReviews.length;
      await Listings.update(listingId, {});
      const listings = store(LISTINGS_KEY).get();
      const lIdx = listings.findIndex(l => l.id === listingId);
      if (lIdx > -1) {
        listings[lIdx].rating = Math.round(avgRating * 10) / 10;
        listings[lIdx].reviewCount = listingReviews.length;
        store(LISTINGS_KEY).set(listings);
      }

      return review;
    },

    async forListing(listingId) {
      return store(REVIEWS_KEY).get().filter(r => r.listingId === listingId);
    },

    async forSeller(sellerId) {
      return store(REVIEWS_KEY).get().filter(r => r.sellerId === sellerId);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  SEED DATA — populate demo content on first visit
  // ═══════════════════════════════════════════════════════════════════════
  function seedIfEmpty() {
    if (store(LISTINGS_KEY).get().length > 0) return;

    // Create demo users
    const demoUsers = [
      { id: 'demo-sarah', email: 'sarah@charm.space', password: btoa('demo'), name: 'Sarah Chen', avatar: 'SC', bio: 'Photography studio owner and gear enthusiast', location: 'London, UK', joined: '2025-03-15T10:00:00Z', verified: true, rating: 4.9, reviewCount: 47, listingCount: 8, bookingCount: 0 },
      { id: 'demo-marcus', email: 'marcus@charm.space', password: btoa('demo'), name: 'Marcus Webb', avatar: 'MW', bio: 'Filmmaker, podcast producer, audio engineer', location: 'Manchester, UK', joined: '2025-06-01T10:00:00Z', verified: true, rating: 4.8, reviewCount: 31, listingCount: 6, bookingCount: 0 },
      { id: 'demo-aisha', email: 'aisha@charm.space', password: btoa('demo'), name: 'Aisha Kapoor', avatar: 'AK', bio: 'Music producer running a recording room in Dalston', location: 'London, UK', joined: '2025-01-20T10:00:00Z', verified: true, rating: 4.9, reviewCount: 56, listingCount: 12, bookingCount: 0 },
      { id: 'demo-theo',   email: 'theo@charm.space',   password: btoa('demo'), name: 'Theo Byrne',   avatar: 'TB', bio: 'Dance & rehearsal studio owner, choreographer', location: 'London, UK',       joined: '2025-02-10T10:00:00Z', verified: true, rating: 4.9, reviewCount: 38, listingCount: 4, bookingCount: 0 },
      { id: 'demo-lena',   email: 'lena@charm.space',   password: btoa('demo'), name: 'Lena Okafor', avatar: 'LO', bio: 'Gallery curator and artist residency host',    location: 'Bristol, UK',     joined: '2025-04-12T10:00:00Z', verified: true, rating: 4.8, reviewCount: 19, listingCount: 3, bookingCount: 0 },
      { id: 'demo-kai',    email: 'kai@charm.space',    password: btoa('demo'), name: 'Kai Rivers',  avatar: 'KR', bio: 'Tattoo artist — blackwork and minimal linework', location: 'Manchester, UK',  joined: '2025-05-03T10:00:00Z', verified: true, rating: 5.0, reviewCount: 62, listingCount: 2, bookingCount: 0 },
      { id: 'demo-nina',   email: 'nina@charm.space',   password: btoa('demo'), name: 'Nina Halden', avatar: 'NH', bio: 'Music production tutor and session musician',  location: 'Bristol, UK',     joined: '2025-07-22T10:00:00Z', verified: true, rating: 4.9, reviewCount: 24, listingCount: 3, bookingCount: 0 },
      { id: 'demo-ravi',   email: 'ravi@charm.space',   password: btoa('demo'), name: 'Ravi Patel',  avatar: 'RP', bio: 'Rooftop and retreat venues across the South West', location: 'Edinburgh, UK',   joined: '2025-02-28T10:00:00Z', verified: true, rating: 4.7, reviewCount: 15, listingCount: 2, bookingCount: 0 },
    ];
    store(USERS_KEY).set(demoUsers);

    // Create demo listings. Each listing carries a top-level category and,
    // where meaningful, a subcategory so the marketplace can filter both.
    // All listings get a typographic thumbnail if no image is supplied.
    const demoListings = [
      // ── Music Studios ──
      { id: 'listing-ms-1', sellerId: 'demo-aisha', sellerName: 'Aisha Kapoor', sellerAvatar: 'AK',
        title: 'Dalston Recording Room with Vintage API Console',
        description: 'Treated live room with iso booth, 16-channel API console, classic mic locker (U87, SM7B, 57s) and a Yamaha C3 grand. Engineer bookable on request.',
        category: 'music-studios', subcategory: 'recording', condition: 'excellent', type: 'rent',
        priceRent: 180, priceBuy: 0, deposit: 300, location: 'London, UK',
        images: ['images/music-studio.jpg'], tags: ['recording', 'api', 'live room', 'grand piano'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 28, views: 412, featured: true,
        createdAt: '2026-01-12T10:00:00Z', updatedAt: '2026-04-14T10:00:00Z' },
      { id: 'listing-ms-2', sellerId: 'demo-aisha', sellerName: 'Aisha Kapoor', sellerAvatar: 'AK',
        title: 'Rehearsal Room — Backline Included',
        description: 'Daytime rehearsal room with full backline: Orange half-stack, Ampeg bass rig, DW kit, Nord Stage 3, 4-channel vocal PA.',
        category: 'music-studios', subcategory: 'rehearsal', condition: 'good', type: 'rent',
        priceRent: 28, priceBuy: 0, deposit: 40, location: 'London, UK',
        images: ['images/cat-music.jpg'], tags: ['rehearsal', 'backline', 'band'],
        availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 22, views: 201, featured: false,
        createdAt: '2026-02-03T10:00:00Z', updatedAt: '2026-04-09T10:00:00Z' },

      // ── Podcast Studios ──
      { id: 'listing-pod-1', sellerId: 'demo-marcus', sellerName: 'Marcus Webb', sellerAvatar: 'MW',
        title: 'Four-Seat Podcast Studio in the Northern Quarter',
        description: 'Fully treated podcast room: 4× SM7B on boom arms, RodeCaster Pro II, video-ready with 3× 4K cameras and soft key lighting. Producer/engineer optional.',
        category: 'podcast-studios', subcategory: 'audio', condition: 'excellent', type: 'rent',
        priceRent: 95, priceBuy: 0, deposit: 150, location: 'Manchester, UK',
        images: ['images/cat-podcast.jpg'], tags: ['podcast', 'rodecaster', 'sm7b', 'video'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 34, views: 308, featured: true,
        createdAt: '2026-01-25T10:00:00Z', updatedAt: '2026-04-11T10:00:00Z' },
      { id: 'listing-pod-2', sellerId: 'demo-marcus', sellerName: 'Marcus Webb', sellerAvatar: 'MW',
        title: 'Solo Voice-Over Booth — Hourly',
        description: 'Whisper-quiet single-person booth tuned for voice-over and narration. Neumann TLM-103, Apogee Symphony, Reaper/Pro Tools on the Mac.',
        category: 'podcast-studios', subcategory: 'microphones', condition: 'excellent', type: 'rent',
        priceRent: 35, priceBuy: 0, deposit: 0, location: 'Manchester, UK',
        images: ['images/audio-mic.jpg'], tags: ['voiceover', 'neumann', 'booth'],
        availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 18, views: 167, featured: false,
        createdAt: '2026-02-18T10:00:00Z', updatedAt: '2026-04-07T10:00:00Z' },

      // ── Photography Studios ──
      { id: 'listing-ps-1', sellerId: 'demo-sarah', sellerName: 'Sarah Chen', sellerAvatar: 'SC',
        title: 'Daylight Photo Studio — Soho',
        description: 'South-facing 120m² studio with huge windows, white infinity cove, styling area, and hair/makeup room. Ideal for fashion and editorial.',
        category: 'photography-studios', subcategory: 'fashion', condition: 'excellent', type: 'rent',
        priceRent: 220, priceBuy: 0, deposit: 250, location: 'London, UK',
        images: ['images/cat-photo.jpg'], tags: ['daylight', 'cove', 'fashion', 'editorial'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 41, views: 489, featured: true,
        createdAt: '2026-01-08T10:00:00Z', updatedAt: '2026-04-13T10:00:00Z' },
      { id: 'listing-ps-2', sellerId: 'demo-sarah', sellerName: 'Sarah Chen', sellerAvatar: 'SC',
        title: 'White Cyclorama with 10kW Lighting Package',
        description: 'Pure white infinity cove with pre-rigged Aputure 600x, softboxes, C-stands, apple boxes, and a full grip kit. 4.5m ceiling.',
        category: 'photography-studios', subcategory: 'cyclorama', condition: 'excellent', type: 'rent',
        priceRent: 310, priceBuy: 0, deposit: 400, location: 'London, UK',
        images: ['images/hero-studio.jpg'], tags: ['cyclorama', 'infinity', 'video', 'photo'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 26, views: 294, featured: false,
        createdAt: '2026-02-22T10:00:00Z', updatedAt: '2026-04-10T10:00:00Z' },

      // ── Rehearsal / Theater ──
      { id: 'listing-rt-1', sellerId: 'demo-theo', sellerName: 'Theo Byrne', sellerAvatar: 'TB',
        title: 'Black Box Theater — 60 Seats',
        description: 'Intimate black-box theater with retractable seating, basic LX/sound rig, green room and technical booth. Great for previews, R&D, and scratch nights.',
        category: 'rehearsal-theater', subcategory: 'theater', condition: 'good', type: 'rent',
        priceRent: 140, priceBuy: 0, deposit: 200, location: 'London, UK',
        images: ['images/creator-filming.jpg'], tags: ['black box', 'theater', 'performance'],
        availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 17, views: 188, featured: false,
        createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-04-08T10:00:00Z' },
      { id: 'listing-rt-2', sellerId: 'demo-theo', sellerName: 'Theo Byrne', sellerAvatar: 'TB',
        title: 'Rehearsal Hall with Sprung Floor',
        description: 'Bright rehearsal hall with sprung floor, mirrored wall, sound system, upright piano, and plenty of natural light. Ideal for theater and movement.',
        category: 'rehearsal-theater', subcategory: 'performance', condition: 'excellent', type: 'rent',
        priceRent: 45, priceBuy: 0, deposit: 50, location: 'London, UK',
        images: ['images/cat-dance.jpg'], tags: ['rehearsal', 'sprung floor', 'movement'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 23, views: 214, featured: false,
        createdAt: '2026-01-18T10:00:00Z', updatedAt: '2026-04-12T10:00:00Z' },

      // ── Art Spaces ──
      { id: 'listing-art-1', sellerId: 'demo-lena', sellerName: 'Lena Okafor', sellerAvatar: 'LO',
        title: 'Pop-Up Gallery Space in Old Market',
        description: 'Ground-floor white-walled gallery, 90m², high ceilings, track lighting. Hireable for exhibitions, launches, and private views.',
        category: 'art-spaces', subcategory: 'galleries', condition: 'excellent', type: 'rent',
        priceRent: 260, priceBuy: 0, deposit: 300, location: 'Bristol, UK',
        images: [], tags: ['gallery', 'popup', 'exhibition'],
        availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 12, views: 146, featured: true,
        createdAt: '2026-02-14T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z' },
      { id: 'listing-art-2', sellerId: 'demo-lena', sellerName: 'Lena Okafor', sellerAvatar: 'LO',
        title: 'Artist Residency — Two-Week Atelier',
        description: 'Two-week artist residency in a working atelier. Includes private studio, shared kitchen, and a closing open-studio event.',
        category: 'art-spaces', subcategory: 'residencies', condition: 'good', type: 'rent',
        priceRent: 85, priceBuy: 0, deposit: 100, location: 'Bristol, UK',
        images: [], tags: ['residency', 'atelier', 'studio'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 9, views: 98, featured: false,
        createdAt: '2026-03-05T10:00:00Z', updatedAt: '2026-04-06T10:00:00Z' },

      // ── Dance Studios ──
      { id: 'listing-dance-1', sellerId: 'demo-theo', sellerName: 'Theo Byrne', sellerAvatar: 'TB',
        title: 'Hip-Hop Dance Studio with Mirrored Wall',
        description: 'Heavy-duty sprung floor, full mirrored wall, pro sound system. Used weekly by London crews. Hourly or half-day bookings.',
        category: 'dance-studios', subcategory: 'hip-hop', condition: 'excellent', type: 'rent',
        priceRent: 32, priceBuy: 0, deposit: 40, location: 'London, UK',
        images: ['images/cat-dance.jpg'], tags: ['hip hop', 'dance', 'mirrored'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 31, views: 267, featured: true,
        createdAt: '2026-01-28T10:00:00Z', updatedAt: '2026-04-11T10:00:00Z' },
      { id: 'listing-dance-2', sellerId: 'demo-theo', sellerName: 'Theo Byrne', sellerAvatar: 'TB',
        title: 'Ballet Room with Barre and Marley Floor',
        description: 'Classical ballet room with fixed barres, Marley-surface floor, upright piano, and great acoustics.',
        category: 'dance-studios', subcategory: 'ballet', condition: 'excellent', type: 'rent',
        priceRent: 36, priceBuy: 0, deposit: 40, location: 'London, UK',
        images: [], tags: ['ballet', 'barre', 'dance'],
        availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 14, views: 132, featured: false,
        createdAt: '2026-02-20T10:00:00Z', updatedAt: '2026-04-03T10:00:00Z' },

      // ── Training ──
      { id: 'listing-train-1', sellerId: 'demo-nina', sellerName: 'Nina Halden', sellerAvatar: 'NH',
        title: '8-Week Ableton Live Production Course',
        description: 'Small-group production course (max 6). Covers sound design, arrangement, and mixing. Take home two finished tracks.',
        category: 'training', subcategory: 'music', condition: 'excellent', type: 'rent',
        priceRent: 420, priceBuy: 0, deposit: 0, location: 'Bristol, UK',
        images: [], tags: ['course', 'ableton', 'production'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 21, views: 178, featured: false,
        createdAt: '2026-01-30T10:00:00Z', updatedAt: '2026-04-04T10:00:00Z' },
      { id: 'listing-train-2', sellerId: 'demo-sarah', sellerName: 'Sarah Chen', sellerAvatar: 'SC',
        title: 'Studio Photography Weekend Workshop',
        description: 'Two-day intensive weekend on studio lighting, direction, and post. Shoot with real models in a working studio.',
        category: 'training', subcategory: 'photography', condition: 'excellent', type: 'rent',
        priceRent: 295, priceBuy: 0, deposit: 0, location: 'London, UK',
        images: [], tags: ['workshop', 'photography', 'studio'],
        availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 16, views: 142, featured: false,
        createdAt: '2026-02-12T10:00:00Z', updatedAt: '2026-04-02T10:00:00Z' },

      // ── Professionals ──
      { id: 'listing-pro-1', sellerId: 'demo-marcus', sellerName: 'Marcus Webb', sellerAvatar: 'MW',
        title: 'Music Video Director & DP — Day Rate',
        description: '10 years directing music videos and commercials. Day rate includes direction, full camera package (Sony FX6), and colour grade on request.',
        category: 'professionals', subcategory: 'videographers', condition: 'excellent', type: 'rent',
        priceRent: 850, priceBuy: 0, deposit: 0, location: 'Manchester, UK',
        images: [], tags: ['director', 'dp', 'music video'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 27, views: 235, featured: false,
        createdAt: '2026-01-14T10:00:00Z', updatedAt: '2026-04-09T10:00:00Z' },
      { id: 'listing-pro-2', sellerId: 'demo-sarah', sellerName: 'Sarah Chen', sellerAvatar: 'SC',
        title: 'Editorial Photographer — Half / Full Day',
        description: 'Editorial and portrait photographer shooting for magazines and brands for 8+ years. Includes full-frame kit and same-week selects.',
        category: 'professionals', subcategory: 'photographers', condition: 'excellent', type: 'rent',
        priceRent: 620, priceBuy: 0, deposit: 0, location: 'London, UK',
        images: [], tags: ['editorial', 'portrait', 'photographer'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 35, views: 318, featured: true,
        createdAt: '2026-02-06T10:00:00Z', updatedAt: '2026-04-10T10:00:00Z' },

      // ── Marketplace (gear — the original listings, relabelled) ──
      { id: 'listing-1', sellerId: 'demo-sarah', sellerName: 'Sarah Chen', sellerAvatar: 'SC', title: 'Sony FX6 Cinema Camera Kit', description: 'Full-frame cinema camera with 24-70mm f/2.8 lens, V-mount battery plate, XLR handle, and Pelican case. Perfect for commercial and documentary work.', category: 'marketplace', subcategory: 'equipment', condition: 'excellent', type: 'rent', priceRent: 95, priceBuy: 0, deposit: 200, location: 'London, UK', images: ['images/prod-camera.jpg'], tags: ['sony', 'cinema', 'fx6', '4k'], availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 23, views: 342, featured: true, createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-04-10T10:00:00Z' },
      { id: 'listing-2', sellerId: 'demo-marcus', sellerName: 'Marcus Webb', sellerAvatar: 'MW', title: 'Rode NTG5 Shotgun Microphone', description: 'Broadcast-quality shotgun mic with pistol grip, windshield, and XLR cable. Ultra-lightweight and incredibly clear audio.', category: 'marketplace', subcategory: 'equipment', condition: 'excellent', type: 'rent', priceRent: 25, priceBuy: 0, deposit: 50, location: 'Manchester, UK', images: ['images/prod-microphone.jpg'], tags: ['rode', 'shotgun', 'ntg5', 'audio'], availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 18, views: 215, featured: true, createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-04-08T10:00:00Z' },
      { id: 'listing-3', sellerId: 'demo-sarah', sellerName: 'Sarah Chen', sellerAvatar: 'SC', title: 'Aputure 600d Pro LED Light', description: 'Daylight-balanced 600W LED with Bowens mount. Includes light dome, barn doors, and heavy-duty stand. Incredibly powerful output.', category: 'marketplace', subcategory: 'equipment', condition: 'like-new', type: 'rent', priceRent: 55, priceBuy: 0, deposit: 150, location: 'London, UK', images: ['images/prod-lighting.jpg'], tags: ['aputure', 'led', '600d', 'lighting'], availability: 'available', bookedDates: [], rating: 5.0, reviewCount: 12, views: 189, featured: false, createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-04-05T10:00:00Z' },
      { id: 'listing-4', sellerId: 'demo-aisha', sellerName: 'Aisha Kapoor', sellerAvatar: 'AK', title: 'DJI Inspire 3 Professional Drone', description: 'Professional aerial cinematography drone with X9-8K gimbal camera, dual operator control, and TB51 batteries (x4). Licensed operator available.', category: 'marketplace', subcategory: 'equipment', condition: 'excellent', type: 'rent', priceRent: 180, priceBuy: 0, deposit: 500, location: 'London, UK', images: ['images/prod-drone.jpg'], tags: ['dji', 'drone', 'inspire', 'aerial'], availability: 'available', bookedDates: [], rating: 4.7, reviewCount: 8, views: 156, featured: true, createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-04-12T10:00:00Z' },
      { id: 'listing-5', sellerId: 'demo-marcus', sellerName: 'Marcus Webb', sellerAvatar: 'MW', title: 'Canon RF 70-200mm f/2.8L IS USM', description: 'Professional telephoto zoom lens. Razor sharp across the range with dual nano USM motors for silent, fast autofocus. Includes lens hood and pouch.', category: 'marketplace', subcategory: 'equipment', condition: 'excellent', type: 'both', priceRent: 40, priceBuy: 1800, deposit: 100, location: 'Manchester, UK', images: ['images/prod-lens.jpg'], tags: ['canon', 'lens', 'rf', 'telephoto'], availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 15, views: 278, featured: false, createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-04-09T10:00:00Z' },
      { id: 'listing-6', sellerId: 'demo-aisha', sellerName: 'Aisha Kapoor', sellerAvatar: 'AK', title: 'Complete Music Production Bundle', description: 'Yamaha MODX8 synthesizer, Fender Player Plus Strat, Audio-Technica ATH-M50x headphones, and Focusrite Scarlett 4i4. Everything you need for a session.', category: 'marketplace', subcategory: 'instruments', condition: 'good', type: 'rent', priceRent: 75, priceBuy: 0, deposit: 200, location: 'London, UK', images: ['images/prod-instruments.jpg'], tags: ['music', 'production', 'keyboard', 'guitar'], availability: 'available', bookedDates: [], rating: 4.6, reviewCount: 9, views: 134, featured: false, createdAt: '2026-03-05T10:00:00Z', updatedAt: '2026-04-11T10:00:00Z' },
      { id: 'listing-7', sellerId: 'demo-sarah', sellerName: 'Sarah Chen', sellerAvatar: 'SC', title: 'Sennheiser MKH 416 Shotgun Mic', description: 'Industry-standard short shotgun mic for film and broadcast. Known for its exceptional off-axis rejection and rich, full-bodied sound.', category: 'marketplace', subcategory: 'equipment', condition: 'excellent', type: 'rent', priceRent: 30, priceBuy: 0, deposit: 60, location: 'London, UK', images: ['images/prod-microphone.jpg'], tags: ['sennheiser', 'mkh416', 'shotgun', 'film'], availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 21, views: 198, featured: false, createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-04-06T10:00:00Z' },
      { id: 'listing-8', sellerId: 'demo-marcus', sellerName: 'Marcus Webb', sellerAvatar: 'MW', title: 'Godox AD600Pro Strobe Kit (x3)', description: 'Three AD600Pro strobes with stands, softboxes, beauty dish, and wireless trigger. Complete portrait/commercial lighting setup.', category: 'marketplace', subcategory: 'equipment', condition: 'good', type: 'rent', priceRent: 65, priceBuy: 0, deposit: 180, location: 'Manchester, UK', images: ['images/prod-lighting.jpg'], tags: ['godox', 'strobe', 'flash', 'portrait'], availability: 'available', bookedDates: [], rating: 4.5, reviewCount: 7, views: 112, featured: false, createdAt: '2026-02-05T10:00:00Z', updatedAt: '2026-04-07T10:00:00Z' },

      // ── Events / Unique Venues ──
      { id: 'listing-ev-1', sellerId: 'demo-ravi', sellerName: 'Ravi Patel', sellerAvatar: 'RP',
        title: 'Panoramic Rooftop with DJ Booth — Up to 120',
        description: 'Private rooftop terrace with full bar, DJ booth, and skyline views. Permitted to 1am. Includes event manager and sound system.',
        category: 'events-venues', subcategory: 'rooftops', condition: 'excellent', type: 'rent',
        priceRent: 1200, priceBuy: 0, deposit: 800, location: 'Edinburgh, UK',
        images: [], tags: ['rooftop', 'events', 'party'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 19, views: 286, featured: true,
        createdAt: '2026-02-09T10:00:00Z', updatedAt: '2026-04-13T10:00:00Z' },
      { id: 'listing-ev-2', sellerId: 'demo-ravi', sellerName: 'Ravi Patel', sellerAvatar: 'RP',
        title: 'Weekend Retreat Farmhouse — Sleeps 14',
        description: 'Restored 18th-century farmhouse on 6 acres. Perfect for writing retreats, offsites, and creative workshops. Full kitchen, wood stoves, hot tub.',
        category: 'events-venues', subcategory: 'retreats', condition: 'excellent', type: 'rent',
        priceRent: 980, priceBuy: 0, deposit: 500, location: 'Scotland, UK',
        images: [], tags: ['retreat', 'farmhouse', 'offsite'],
        availability: 'available', bookedDates: [], rating: 4.8, reviewCount: 11, views: 172, featured: false,
        createdAt: '2026-01-22T10:00:00Z', updatedAt: '2026-04-08T10:00:00Z' },

      // ── Tattoo Artists ──
      { id: 'listing-tat-1', sellerId: 'demo-kai', sellerName: 'Kai Rivers', sellerAvatar: 'KR',
        title: 'Kai Rivers — Blackwork & Bold Linework',
        description: 'Specialist in blackwork and bold linework. 6+ years, hygienic private studio in central Manchester. Consultations free.',
        category: 'tattoo-artists', subcategory: 'blackwork', condition: 'excellent', type: 'rent',
        priceRent: 180, priceBuy: 0, deposit: 60, location: 'Manchester, UK',
        images: [], tags: ['tattoo', 'blackwork', 'linework'],
        availability: 'available', bookedDates: [], rating: 5.0, reviewCount: 62, views: 401, featured: true,
        createdAt: '2026-01-06T10:00:00Z', updatedAt: '2026-04-14T10:00:00Z' },
      { id: 'listing-tat-2', sellerId: 'demo-kai', sellerName: 'Kai Rivers', sellerAvatar: 'KR',
        title: 'Fine-Line Minimal Tattoos — Walk-ins Welcome',
        description: 'Micro and minimal tattoos, one-line drawings, dainty pieces. Hourly rate for a chatty, relaxed session.',
        category: 'tattoo-artists', subcategory: 'minimal', condition: 'excellent', type: 'rent',
        priceRent: 120, priceBuy: 0, deposit: 40, location: 'Manchester, UK',
        images: [], tags: ['tattoo', 'minimal', 'fineline'],
        availability: 'available', bookedDates: [], rating: 4.9, reviewCount: 38, views: 254, featured: false,
        createdAt: '2026-02-25T10:00:00Z', updatedAt: '2026-04-11T10:00:00Z' },
    ];
    store(LISTINGS_KEY).set(demoListings);
  }

  // Run seed on load
  seedIfEmpty();

  // ═══════════════════════════════════════════════════════════════════════
  //  NAV AUTH UI — auto-update nav based on login state
  // ═══════════════════════════════════════════════════════════════════════
  function updateNavAuth() {
    const user = Auth.currentUser();
    const loginBtn = document.querySelector('a.btn-ghost[href="login.html"]');
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    // Remove any existing auth elements we injected
    navRight.querySelectorAll('.charm-auth-el').forEach(el => el.remove());

    if (user) {
      // Replace Login with user avatar dropdown
      if (loginBtn) loginBtn.style.display = 'none';

      const userBtn = document.createElement('div');
      userBtn.className = 'charm-auth-el';
      userBtn.style.cssText = 'position:relative;';
      userBtn.innerHTML = `
        <button id="nav-user-btn" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,rgba(157,111,255,0.25),rgba(226,168,75,0.25));border:1px solid var(--c-border-2);color:var(--c-text);font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color 0.2s,transform 0.2s;" aria-label="Account menu">${user.avatar}</button>
        <div id="nav-user-menu" style="display:none;position:absolute;top:calc(100% + 8px);right:0;min-width:200px;background:var(--c-elevated);border:1px solid var(--c-border-2);border-radius:12px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.5);z-index:9999;">
          <div style="padding:14px 16px;border-bottom:1px solid var(--c-border);display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,rgba(157,111,255,0.3),rgba(226,168,75,0.3));display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--c-text);">${user.avatar}</div>
            <div>
              <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:600;color:var(--c-text);">${user.name}</div>
              <div style="font-size:11px;color:var(--c-text-3);">${user.email}</div>
            </div>
          </div>
          <a href="dashboard.html" style="display:block;padding:10px 16px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--c-text-2);text-decoration:none;transition:background 0.15s;">Dashboard</a>
          <a href="create-listing.html" style="display:block;padding:10px 16px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--c-text-2);text-decoration:none;transition:background 0.15s;">Create Listing</a>
          <a href="settings.html" style="display:block;padding:10px 16px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--c-text-2);text-decoration:none;transition:background 0.15s;">Settings</a>
          <div style="border-top:1px solid var(--c-border);padding:10px 16px;">
            <button id="nav-logout-btn" style="font-family:'Syne',sans-serif;font-size:12px;font-weight:600;color:var(--c-coral);background:none;border:none;cursor:pointer;">Log Out</button>
          </div>
        </div>
      `;
      navRight.appendChild(userBtn);

      // Toggle menu
      const btn = userBtn.querySelector('#nav-user-btn');
      const menu = userBtn.querySelector('#nav-user-menu');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', () => { menu.style.display = 'none'; });
      menu.querySelectorAll('a').forEach(a => {
        a.addEventListener('mouseenter', () => { a.style.background = 'rgba(255,255,255,0.05)'; });
        a.addEventListener('mouseleave', () => { a.style.background = 'transparent'; });
      });

      // Logout
      userBtn.querySelector('#nav-logout-btn').addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'home.html';
      });
    } else {
      if (loginBtn) loginBtn.style.display = '';
    }

    // Update notification badge
    const notifIcon = document.querySelector('a[href="notifications.html"] .nav-icon, a.nav-icon[href="notifications.html"]');
    if (notifIcon && user) {
      const count = Notifications.unreadCount();
      let badge = notifIcon.querySelector('.notif-badge');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'notif-badge';
          badge.style.cssText = 'position:absolute;top:-2px;right:-2px;width:16px;height:16px;border-radius:50%;background:var(--c-coral);color:#fff;font-family:"Syne",sans-serif;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;';
          notifIcon.style.position = 'relative';
          notifIcon.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : count;
      } else if (badge) {
        badge.remove();
      }
    }
  }

  // Run on DOM ready and on auth change
  function initNavAuth() { updateNavAuth(); }
  Auth.onChange(() => updateNavAuth());
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavAuth);
  } else { initNavAuth(); }

  // ═══════════════════════════════════════════════════════════════════════
  //  EXPOSE API
  // ═══════════════════════════════════════════════════════════════════════
  window.CharmDB = {
    Auth,
    Listings,
    Bookings,
    Notifications,
    Reviews,
    Categories,
    config: { useSupabase: USE_SUPABASE }
  };

})();
