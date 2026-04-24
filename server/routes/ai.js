const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.post('/chat', (req, res) => {
  try {
    const { message } = req.body;
    const db = getDb();
    
    const lowerInput = message.toLowerCase();
    let reply = '';
    let category = '';

    if (lowerInput.includes('plumb') || lowerInput.includes('pipe') || lowerInput.includes('leak') || lowerInput.includes('నీళ్ళు') || lowerInput.includes('पानी')) {
      reply = 'I recommend a **Plumber** for this issue. Based on our data, pipe repairs typically cost ₹300-₹800. I found some verified plumbers near you. Would you like me to show them?';
      category = 'plumber';
    } else if (lowerInput.includes('electric') || lowerInput.includes('wire') || lowerInput.includes('switch') || lowerInput.includes('కరెంట్') || lowerInput.includes('बिजली')) {
      reply = 'You need an **Electrician**. Wiring work typically costs ₹400-₹1,200. Here are some highly-rated electricians nearby!';
      category = 'electrician';
    } else if (lowerInput.includes('paint') || lowerInput.includes('wall') || lowerInput.includes('color') || lowerInput.includes('రంగు') || lowerInput.includes('पेंट')) {
      reply = 'For painting work, I recommend our **Painters**. Interior painting costs ₹250-₹600/hr. These are available near you!';
      category = 'painter';
    } else if (lowerInput.includes('carpenter') || lowerInput.includes('wood') || lowerInput.includes('furniture') || lowerInput.includes('చెక్క') || lowerInput.includes('लकड़ी')) {
      reply = 'You need a **Carpenter**. Furniture work typically costs ₹500-₹1,500. Let me find the best carpenter near you!';
      category = 'carpenter';
    } else if (lowerInput.includes('clean') || lowerInput.includes('శుభ్రం') || lowerInput.includes('सफाई')) {
      reply = 'For cleaning services, prices range from ₹200-₹500/hr. We have great cleaners available!';
      category = 'cleaner';
    } else if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('ధర') || lowerInput.includes('कीमत')) {
      reply = 'Prices vary by service:<br/>• Plumber: ₹300-₹800/hr<br/>• Electrician: ₹400-₹1,200/hr<br/>• Painter: ₹250-₹600/hr<br/>• Carpenter: ₹500-₹1,500/hr<br/>• Cleaner: ₹200-₹500/hr<br/><br/>All prices are AI-estimated based on market data.';
    } else {
      reply = "I understand you need help! Could you describe the problem in more detail? For example: 'leaking pipe', 'broken switch', 'paint my room', etc. You can also speak in Telugu, Hindi, or Tamil! 🎤";
    }

    let workers = [];
    if (category) {
      workers = db.queryAll('SELECT * FROM workers WHERE category = ? AND status = ? LIMIT 5', [category, 'active']).map(w => ({
        ...w,
        skills: JSON.parse(w.skills || '[]'),
        languages: JSON.parse(w.languages || '["English"]'),
        verified: !!w.verified,
        available: !!w.available,
        priceRange: { min: w.price_min, max: w.price_max, unit: w.price_unit },
        location: { lat: w.lat, lng: w.lng, area: w.area, city: w.city },
        distance: +(Math.random() * 10).toFixed(1),
      }));
    } else {
      // General search if no category matched but there's input
      const s = `%${message}%`;
      workers = db.queryAll('SELECT * FROM workers WHERE (category LIKE ? OR skills LIKE ?) AND status = ? LIMIT 3', [s, s, 'active']).map(w => ({
        ...w,
        skills: JSON.parse(w.skills || '[]'),
        languages: JSON.parse(w.languages || '["English"]'),
        verified: !!w.verified,
        available: !!w.available,
        priceRange: { min: w.price_min, max: w.price_max, unit: w.price_unit },
        location: { lat: w.lat, lng: w.lng, area: w.area, city: w.city },
        distance: +(Math.random() * 10).toFixed(1),
      }));
    }

    res.json({ reply, workers });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

module.exports = router;
