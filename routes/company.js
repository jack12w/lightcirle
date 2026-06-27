// Company Info API
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// Default "Why Choose Us" data
const defaultWhyChooseUs = [
  { icon: 'fa-industry', title: 'Factory Direct', desc: 'No middlemen. Better margins for your business with transparent factory pricing.' },
  { icon: 'fa-check-circle', title: 'Quality Assured', desc: 'AQL 2.5 inspection standard. Every batch checked before shipment. OEKO-TEX certified fabrics.' },
  { icon: 'fa-leaf', title: 'Premium Fabrics', desc: 'Moisture-wicking, 4-way stretch, squat-proof. Nylon-Spandex, recycled options, organic blends.' },
  { icon: 'fa-rocket', title: 'Fast Turnaround', desc: '15 days sampling + 15-25 days production. Express shipping available worldwide.' },
  { icon: 'fa-whatsapp', title: 'WhatsApp Support', desc: 'Direct communication with our team. Quick response, no email delays. We speak English.' },
  { icon: 'fa-globe-americas', title: 'Global Shipping', desc: 'DDU/DDP options to 30+ countries. DHL, UPS, FedEx, air & sea freight.' }
];

const defaultEquipmentList = [
  '4-Needle 6-Thread Machines', 'Flat Lock Machines', 'Bartack Reinforcement',
  'Semi-Automatic Sewing', 'Computerized Cutting', 'Digital Pattern Making'
];

// GET /api/company — retrieve company info
router.get('/', (req, res) => {
  try {
    const d = getDb();
    let info = d.prepare('SELECT * FROM company_info WHERE id = 1').get();
    if (!info) {
      d.prepare('INSERT INTO company_info (id) VALUES (1)').run();
      info = d.prepare('SELECT * FROM company_info WHERE id = 1').get();
    }
    res.json({
      aboutTitle: info.about_title,
      aboutText: info.about_text,
      stats: {
        facilitySize: info.facility_size,
        workers: info.workers,
        monthlyCapacity: info.monthly_capacity,
        countriesShipped: info.countries_shipped,
      },
      capabilities: JSON.parse(info.capabilities || '[]'),
      gallery: JSON.parse(info.gallery || '[]'),
      whyChooseUs: JSON.parse(info.why_choose_us || '[]'),
      equipmentTitle: info.equipment_title || 'Advanced Equipment for Premium Results',
      equipmentDesc: info.equipment_desc || '',
      equipmentList: JSON.parse(info.equipment_list || '[]'),
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/company — update company info
router.put('/', (req, res) => {
  try {
    const d = getDb();
    const data = req.body;
    const capabilities = JSON.stringify(data.capabilities || []);
    const gallery = JSON.stringify(data.gallery || []);
    const whyChooseUs = JSON.stringify(data.whyChooseUs || defaultWhyChooseUs);
    const equipmentList = JSON.stringify(data.equipmentList || defaultEquipmentList);
    d.prepare(`
      UPDATE company_info SET
        about_title=?, about_text=?,
        facility_size=?, workers=?, monthly_capacity=?, countries_shipped=?,
        capabilities=?, gallery=?,
        why_choose_us=?, equipment_title=?, equipment_desc=?, equipment_list=?,
        updated_at=datetime('now')
      WHERE id=1
    `).run(
      data.aboutTitle || '', data.aboutText || '',
      data.stats?.facilitySize || '3,000', data.stats?.workers || '120+',
      data.stats?.monthlyCapacity || '300K', data.stats?.countriesShipped || '30+',
      capabilities, gallery,
      whyChooseUs, data.equipmentTitle || '', data.equipmentDesc || '', equipmentList
    );
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
