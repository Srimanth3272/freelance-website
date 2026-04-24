import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppContext = createContext();

// Mock data for workers
const MOCK_WORKERS = [];

const CATEGORIES = [
  { id: 'plumber', name: 'Plumber', icon: '🔧', nameHi: 'प्लंबर', nameTe: 'ప్లంబర్', nameTa: 'குழாய்த்தொழிலாளி', color: '#3b82f6' },
  { id: 'electrician', name: 'Electrician', icon: '⚡', nameHi: 'इलेक्ट्रीशियन', nameTe: 'ఎలక్ట్రీషియన్', nameTa: 'மின்சாரத் தொழிலாளி', color: '#f59e0b' },
  { id: 'painter', name: 'Painter', icon: '🎨', nameHi: 'पेंटर', nameTe: 'పెయింటర్', nameTa: 'ஓவியர்', color: '#8b5cf6' },
  { id: 'carpenter', name: 'Carpenter', icon: '🪚', nameHi: 'बढ़ई', nameTe: 'వడ్లవాడు', nameTa: 'தச்சர்', color: '#a16207' },
  { id: 'construction', name: 'Construction', icon: '🏗️', nameHi: 'निर्माण', nameTe: 'నిర్మాణం', nameTa: 'கட்டுமானம்', color: '#dc2626' },
  { id: 'cleaner', name: 'Cleaner', icon: '🧹', nameHi: 'सफाई', nameTe: 'శుభ్రం', nameTa: 'சுத்தம்', color: '#10b981' },
  { id: 'ac_repair', name: 'AC Repair', icon: '❄️', nameHi: 'एसी रिपेयर', nameTe: 'AC రిపేర్', nameTa: 'ஏசி பழுது', color: '#06b6d4' },
  { id: 'appliance', name: 'Appliance Repair', icon: '🔌', nameHi: 'उपकरण मरम्मत', nameTe: 'ఉపకరణ రిపేర్', nameTa: 'சாதன பழுது', color: '#6366f1' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

const TRANSLATIONS = {
  en: {
    appName: 'KaamWala',
    tagline: 'Find Trusted Workers Near You',
    searchPlaceholder: 'Search for a service... (e.g., "plumber near me")',
    voiceSearch: 'Tap to speak',
    categories: 'Categories',
    nearbyWorkers: 'Nearby Workers',
    viewAll: 'View All',
    bookNow: 'Book Now',
    verified: 'Verified',
    available: 'Available',
    unavailable: 'Busy',
    reviews: 'reviews',
    experience: 'yrs exp',
    perHour: '/hr',
    perDay: '/day',
    login: 'Login',
    signup: 'Sign Up',
    home: 'Home',
    search: 'Search',
    bookings: 'Bookings',
    profile: 'Profile',
    chat: 'Chat',
    howItWorks: 'How It Works',
    step1Title: 'Search',
    step1Desc: 'Find workers by category or describe your problem',
    step2Title: 'Compare',
    step2Desc: 'View profiles, ratings, and transparent prices',
    step3Title: 'Book',
    step3Desc: 'Book instantly and track your service',
    step4Title: 'Review',
    step4Desc: 'Rate your experience and help others',
    aiAssistant: 'AI Assistant',
    aiGreeting: 'Hi! I\'m your KaamWala assistant. How can I help you today?',
    aiPlaceholder: 'Type or speak your problem...',
    popularServices: 'Popular Services',
    whyKaamWala: 'Why KaamWala?',
    benefit1Title: 'Verified Workers',
    benefit1Desc: 'All workers are background-verified for your safety',
    benefit2Title: 'Fair Pricing',
    benefit2Desc: 'AI-powered price estimates ensure you pay a fair price',
    benefit3Title: 'Voice First',
    benefit3Desc: 'Use voice in your language — no typing needed',
    benefit4Title: 'Instant Booking',
    benefit4Desc: 'Book a worker in under 60 seconds',
    getStarted: 'Get Started',
    orContinueWith: 'or continue with',
    enterMobile: 'Enter your mobile number',
    sendOTP: 'Send OTP',
    enterOTP: 'Enter OTP',
    verifyOTP: 'Verify OTP',
    selectRole: 'I am a',
    customer: 'Customer',
    worker: 'Worker',
    filterDistance: 'Distance',
    filterRating: 'Rating',
    filterPrice: 'Price',
    filterAvailability: 'Availability',
    sortBy: 'Sort by',
    results: 'results',
    noResults: 'No workers found',
    tryAgain: 'Try different filters or search terms',
    estimatedPrice: 'Estimated Price',
    bookingDetails: 'Booking Details',
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    describeIssue: 'Describe your issue',
    confirmBooking: 'Confirm Booking',
    paymentMethod: 'Payment Method',
    upi: 'UPI',
    cash: 'Cash',
    workerProfile: 'Worker Profile',
    completedJobs: 'Jobs Done',
    languages: 'Languages',
    skills: 'Skills',
    aboutMe: 'About Me',
    bookThisWorker: 'Book This Worker',
    callNow: 'Call Now',
    messageNow: 'Message',
    heroTitlePrefix: 'Find',
    heroTitleHighlight: 'Trusted Workers',
    heroTitleMid: 'Near You,',
    heroTitleAccent: 'Instantly',
    heroSubtitle: 'Plumbers, electricians, painters, carpenters & more — verified, rated, and ready to help. Just speak or type what you need.',
  },
  hi: {
    appName: 'कामवाला',
    tagline: 'अपने पास भरोसेमंद कारीगर खोजें',
    searchPlaceholder: 'सेवा खोजें... (जैसे "पास में प्लंबर")',
    voiceSearch: 'बोलने के लिए टैप करें',
    categories: 'श्रेणियां',
    nearbyWorkers: 'पास के कारीगर',
    viewAll: 'सभी देखें',
    bookNow: 'अभी बुक करें',
    verified: 'सत्यापित',
    available: 'उपलब्ध',
    unavailable: 'व्यस्त',
    reviews: 'समीक्षाएं',
    experience: 'साल अनुभव',
    login: 'लॉगिन',
    signup: 'साइन अप',
    home: 'होम',
    search: 'खोजें',
    bookings: 'बुकिंग',
    profile: 'प्रोफ़ाइल',
    getStarted: 'शुरू करें',
    enterMobile: 'अपना मोबाइल नंबर दर्ज करें',
    sendOTP: 'OTP भेजें',
    heroTitlePrefix: 'खोजें',
    heroTitleHighlight: 'भरोसेमंद कारीगर',
    heroTitleMid: 'अपने पास,',
    heroTitleAccent: 'तुरंत',
    heroSubtitle: 'प्लंबर, इलेक्ट्रीशियन, पेंटर, बढ़ई और बहुत कुछ - सत्यापित और मदद के लिए तैयार। बस बोलें या टाइप करें।',
  },
  te: {
    appName: 'కామ్‌వాలా',
    tagline: 'మీ సమీపంలో నమ్మకమైన పనివారిని కనుగొనండి',
    searchPlaceholder: 'సేవ కోసం వెతకండి... (ఉదా: "సమీపంలో ప్లంబర్")',
    voiceSearch: 'మాట్లాడటానికి నొక్కండి',
    categories: 'వర్గాలు',
    nearbyWorkers: 'సమీపంలోని పనివారు',
    viewAll: 'అన్నీ చూడండి',
    bookNow: 'ఇప్పుడు బుక్ చేయండి',
    verified: 'ధృవీకరించబడింది',
    available: 'అందుబాటులో',
    unavailable: 'బిజీ',
    reviews: 'సమీక్షలు',
    experience: 'సంవత్సరాల అనుభవం',
    login: 'లాగిన్',
    signup: 'సైన్ అప్',
    home: 'హోమ్',
    search: 'వెతకండి',
    bookings: 'బుకింగ్‌లు',
    profile: 'ప్రొఫైల్',
    getStarted: 'ప్రారంభించండి',
    enterMobile: 'మీ మొబైల్ నంబర్ నమోదు చేయండి',
    sendOTP: 'OTP పంపండి',
    heroTitlePrefix: 'కనుగొనండి',
    heroTitleHighlight: 'నమ్మకమైన పనివారిని',
    heroTitleMid: 'మీ సమీపంలో,',
    heroTitleAccent: 'తక్షణమే',
    heroSubtitle: 'ప్లంబర్లు, ఎలక్ట్రీషియన్లు, పెయింటర్లు మరియు మరిన్ని - ధృవీకరించబడినవారు మరియు సహాయం చేయడానికి సిద్ధంగా ఉన్నారు. మాట్లాడండి లేదా టైప్ చేయండి.',
  },
  ta: {
    appName: 'காம்வாலா',
    tagline: 'உங்களுக்கு அருகிலுள்ள நம்பகமான தொழிலாளர்களைக் கண்டறியுங்கள்',
    searchPlaceholder: 'சேவையைத் தேடுங்கள்...',
    voiceSearch: 'பேச தட்டவும்',
    categories: 'வகைகள்',
    nearbyWorkers: 'அருகிலுள்ள தொழிலாளர்கள்',
    getStarted: 'தொடங்கு',
  }
};

export function AppProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [workerApplications, setWorkerApplications] = useState([]);

  useEffect(() => {
    import('../services/api').then(({ workersAPI }) => {
      workersAPI.list().then((data) => {
        if (data && data.workers) {
          setWorkers(data.workers);
        }
      }).catch(err => {
        console.error('Failed to fetch workers:', err);
        setWorkers(MOCK_WORKERS); // Fallback to mock data
      });
    });
  }, []);

  const t = useCallback((key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  }, [language]);

  const login = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    import('../services/api').then(({ authAPI }) => authAPI.logout());
  }, []);

  useEffect(() => {
    import('../services/api').then(({ authAPI }) => {
      if (authAPI.isLoggedIn()) {
        const storedUser = authAPI.getUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      import('../services/api').then(({ bookingsAPI }) => {
        bookingsAPI.list().then(data => {
          if (data && data.bookings) {
            setBookings(data.bookings);
          }
        }).catch(err => console.error('Failed to load bookings:', err));
      });
    } else {
      setBookings([]);
    }
  }, [isAuthenticated]);

  const addBooking = useCallback((booking) => {
    import('../services/api').then(({ bookingsAPI }) => {
      bookingsAPI.create(booking).then(data => {
        if (data.booking) {
          setBookings(prev => [...prev, data.booking]);
        }
      }).catch(err => {
        console.error('Failed to create booking', err);
        setBookings(prev => [...prev, { ...booking, id: Date.now(), status: 'pending', createdAt: new Date() }]);
      });
    });
  }, []);

  // Admin: Add a new worker directly
  const addWorker = useCallback((workerData) => {
    const newWorker = {
      ...workerData,
      id: Date.now(),
      rating: 0,
      reviews: 0,
      completedJobs: 0,
      distance: Math.round(Math.random() * 10 * 10) / 10,
      verified: true,
      available: true,
      portfolio: [],
      createdAt: new Date(),
    };
    setWorkers(prev => [...prev, newWorker]);
    return newWorker;
  }, []);

  // Admin: Update existing worker
  const updateWorker = useCallback((workerId, updates) => {
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...updates } : w));
  }, []);

  // Admin: Delete worker
  const deleteWorker = useCallback((workerId) => {
    setWorkers(prev => prev.filter(w => w.id !== workerId));
  }, []);

  // Worker: Submit registration application
  const submitWorkerApplication = useCallback((applicationData) => {
    const newApp = {
      ...applicationData,
      id: Date.now(),
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date(),
    };
    setWorkerApplications(prev => [...prev, newApp]);
    return newApp;
  }, []);

  // Admin: Approve worker application
  const approveWorkerApplication = useCallback((appId) => {
    setWorkerApplications(prev => {
      const app = prev.find(a => a.id === appId);
      if (app) {
        // Create the worker from the application
        const newWorker = {
          id: Date.now() + 1,
          name: app.name,
          phone: app.phone,
          email: app.email,
          category: app.category,
          skills: app.skills || [],
          experience: app.experience || 0,
          rating: 0,
          reviews: 0,
          priceRange: app.priceRange || { min: 300, max: 800, unit: 'per hour' },
          location: app.location || { lat: 17.3850, lng: 78.4867, area: app.area || 'Unknown', city: app.city || 'Hyderabad' },
          distance: Math.round(Math.random() * 10 * 10) / 10,
          available: true,
          verified: true,
          avatar: app.photoUrl || null,
          completedJobs: 0,
          portfolio: [],
          languages: app.languages || ['English'],
          bio: app.bio || '',
          idProofType: app.idProofType,
          idProofNumber: app.idProofNumber,
          createdAt: new Date(),
        };
        setWorkers(wPrev => [...wPrev, newWorker]);
      }
      return prev.map(a => a.id === appId ? { ...a, status: 'approved' } : a);
    });
  }, []);

  // Admin: Reject worker application
  const rejectWorkerApplication = useCallback((appId, reason) => {
    setWorkerApplications(prev =>
      prev.map(a => a.id === appId ? { ...a, status: 'rejected', rejectionReason: reason } : a)
    );
  }, []);

  const value = {
    language,
    setLanguage,
    user,
    isAuthenticated,
    login,
    logout,
    t,
    workers,
    categories: CATEGORIES,
    languages: LANGUAGES,
    bookings,
    addBooking,
    chatMessages,
    setChatMessages,
    addWorker,
    updateWorker,
    deleteWorker,
    workerApplications,
    submitWorkerApplication,
    approveWorkerApplication,
    rejectWorkerApplication,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
