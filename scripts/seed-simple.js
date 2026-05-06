const postgres = require("postgres");

const topics = [
  { title: "Acute Coronary Syndrome (ACS) Recognition", summary: "Identifying and managing acute coronary syndrome", guidance: "Assess chest pain, obtain 12-lead ECG within 10 min, IV access, aspirin 300mg, oxygen if SpO2 <94%", area: "cardiac" },
  { title: "Cardiac Arrest Management", summary: "High-quality CPR and defibrillation protocols", guidance: "Chest compressions 100-120/min, minimize interruptions, defibrillate, IV/IO access, epinephrine every 3-5 min", area: "cardiac" },
  { title: "Atrial Fibrillation with RVR", summary: "Managing symptomatic atrial fibrillation", guidance: "Assess stability, 12-lead ECG, IV access, consider beta-blocker or calcium channel blocker", area: "cardiac" },
  { title: "Heart Failure Exacerbation", summary: "Acute decompensated heart failure treatment", guidance: "Position upright, high-flow oxygen, IV access, diuretics for pulmonary edema", area: "cardiac" },
  { title: "Hypertensive Emergency", summary: "Severely elevated blood pressure management", guidance: "Assess end-organ damage, IV access, monitor BP, controlled reduction, physician evaluation", area: "cardiac" },
  { title: "Penetrating Chest Trauma", summary: "Penetrating wounds to the chest", guidance: "Seal open pneumothorax, two large-bore IVs, oxygen, monitor for tension pneumothorax", area: "trauma" },
  { title: "Abdominal Trauma with Evisceration", summary: "Exposed abdominal organs handling", guidance: "Cover with moist sterile dressing, gentle pressure, IV access, oxygen, immobilize", area: "trauma" },
  { title: "Pelvic Fracture Management", summary: "Pelvic fracture recognition and stabilization", guidance: "Pelvic binder, IV access, oxygen, NPO, monitor for internal bleeding", area: "trauma" },
  { title: "Extremity Amputation", summary: "Traumatic limb amputation management", guidance: "Control hemorrhage, tourniquet if needed, recover part, saline-soaked gauze, ice", area: "trauma" },
  { title: "Crush Injuries and Compartment Syndrome", summary: "Crush injury management", guidance: "Document time, assess neurovascular status, pain control, IV access, rhabdomyolysis monitoring", area: "trauma" },
  { title: "Severe Asthma Exacerbation", summary: "Acute asthma attack with respiratory distress", guidance: "Upright position, high-flow oxygen, IV access, bronchodilators, steroids", area: "respiratory" },
  { title: "COPD Exacerbation", summary: "Acute COPD exacerbation treatment", guidance: "Careful SpO2, controlled oxygen (88-92%), IV access, bronchodilators, steroids", area: "respiratory" },
  { title: "Anaphylaxis with Respiratory Compromise", summary: "Managing anaphylaxis with airway difficulty", guidance: "Position airway, 100% oxygen, IV access, IM epinephrine, antihistamines, steroids", area: "respiratory" },
  { title: "Foreign Body Aspiration", summary: "Inhaled foreign body management", guidance: "Assess obstruction severity, high-flow oxygen, back blows, no agitation", area: "respiratory" },
  { title: "Tension Pneumothorax", summary: "Life-threatening pneumothorax treatment", guidance: "Recognize tracheal deviation, needle decompression at 2nd ICS, IV access, oxygen", area: "respiratory" },
  { title: "Acute Ischemic Stroke Recognition", summary: "Stroke recognition and rapid transport", guidance: "FAST assessment, note symptom onset time, IV access, glucose level, oxygen", area: "neurological" },
  { title: "Intracranial Hemorrhage Management", summary: "Intracranial hemorrhage care", guidance: "Head-of-bed elevation 30°, careful IV access, oxygen, pain control", area: "neurological" },
  { title: "Seizure Management", summary: "Active and post-ictal seizure treatment", guidance: "Protect airway, oxygen, IV access, benzodiazepines, recovery position", area: "neurological" },
  { title: "Altered Mental Status Investigation", summary: "Decreased consciousness systematic approach", guidance: "Rapid glucose assessment, AVPU/GCS, history, vitals, IV access", area: "neurological" },
  { title: "Status Epilepticus", summary: "Prolonged or repeated seizure management", guidance: "IV/IO access, oxygen, benzodiazepines, prepare for intubation", area: "neurological" },
  { title: "Complicated Childbirth in the Field", summary: "Delivery when hospital transport impossible", guidance: "Sterile field, support delivery, normal progression, do not pull cord", area: "obstetrics" },
  { title: "Severe Preeclampsia and Eclampsia", summary: "Hypertensive emergency in pregnancy", guidance: "IV access, oxygen, monitor BP carefully, magnesium sulfate available", area: "obstetrics" },
  { title: "Obstetric Hemorrhage", summary: "Postpartum and antepartum hemorrhage", guidance: "Identify bleeding source, two large-bore IVs, uterine massage, oxytocin", area: "obstetrics" },
  { title: "Amniotic Fluid Embolism", summary: "Life-threatening obstetric complication", guidance: "100% oxygen, IV access, CPR if needed, consider vasopressors", area: "obstetrics" },
  { title: "Placental Abruption", summary: "Premature placental separation", guidance: "Vaginal bleeding and pain recognition, IV access, oxygen, monitor fetal tones", area: "obstetrics" },
  { title: "Pediatric Respiratory Distress", summary: "Child respiratory distress management", guidance: "Assess work of breathing, supplemental oxygen, IV/IO access, bronchodilators", area: "pediatrics" },
  { title: "Febrile Seizure in Children", summary: "Seizure with fever in young children", guidance: "Cool gradually, obtain temperature, assess meningitis signs, IV access", area: "pediatrics" },
  { title: "Acute Epiglottitis", summary: "Epiglottic swelling airway emergency", guidance: "Do NOT agitate or examine throat, high-flow oxygen, expedite to OR", area: "pediatrics" },
  { title: "Croup Management", summary: "Laryngeal inflammation in children", guidance: "Cool humidified oxygen, reassurance, dexamethasone consideration", area: "pediatrics" },
  { title: "Pediatric Sepsis Recognition", summary: "Early sepsis identification in children", guidance: "Fever, altered mental status, tachycardia, IV/IO access, high-flow oxygen", area: "pediatrics" },
  { title: "Mass Casualty Incident Triage", summary: "Multiple patient incident triage", guidance: "START system, respiratory status, perfusion, mental status assessment", area: "operations" },
  { title: "Hazardous Material Scene Safety", summary: "Hazmat exposure response", guidance: "No entry without PPE, hot/warm/cold zones, decontamination before treatment", area: "operations" },
  { title: "Vehicle Extrication Principles", summary: "Extrication and patient care", guidance: "Cervical spine precautions, coordinate with fire, minimize movement", area: "operations" },
  { title: "Tactical Emergency Medical Support", summary: "Law enforcement tactical medical support", guidance: "Tactical gear, threat awareness, care from cover, treatment areas", area: "operations" },
  { title: "Pandemic and Infectious Disease Response", summary: "Disease outbreak response protocols", guidance: "Appropriate PPE, isolation precautions, communicate risks, decontamination", area: "operations" },
  { title: "Acute MI Complications", summary: "Heart attack complication management", guidance: "Recognize cardiogenic shock, IV access, oxygen, vasopressors consideration", area: "cardiac" },
  { title: "Hemorrhagic Shock Management", summary: "Life-threatening blood loss treatment", guidance: "External bleeding control, large-bore IVs, type and crossmatch, trauma center", area: "trauma" },
  { title: "Acute Respiratory Distress Syndrome", summary: "Severe lung injury and respiratory failure", guidance: "High-flow oxygen with monitoring, IV access, prepare for intubation", area: "respiratory" },
  { title: "Subarachnoid Hemorrhage", summary: "Ruptured aneurysm management", guidance: "Keep quiet, careful IV access, oxygen, neuro monitoring, neurosurgical center", area: "neurological" },
  { title: "Preterm Labor Management", summary: "Premature labor before 37 weeks", guidance: "IV access, oxygen, monitor contractions, fetal heart tones, NICU facility", area: "obstetrics" },
  { title: "Pediatric Metabolic Emergencies", summary: "Hypoglycemia and DKA in children", guidance: "Rapid glucose assessment, IV dextrose, IV access, oxygen", area: "pediatrics" },
];

const sql = postgres({
  host: "localhost",
  port: 15432,
  database: "paramedic_learnings",
  username: "postgres",
  password: "postgres",
});

(async () => {
  try {
    let count = 0;
    for (const topic of topics) {
      await sql`INSERT INTO topics (title, summary, guidance, area, created_by, created_at, updated_at)
                VALUES (${topic.title}, ${topic.summary}, ${topic.guidance}, ${topic.area}, 'system', NOW(), NOW())`;
      count++;
    }
    console.log(`✓ Successfully seeded ${count} topics`);
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
