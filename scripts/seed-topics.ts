import { db } from "../src/db";
import { topics } from "../src/db/schema";

const seedTopics = [
  // Cardiac
  {
    title: "Acute Coronary Syndrome (ACS) Recognition",
    summary: "Identifying and managing acute coronary syndrome in the field",
    guidance: "Assess chest pain characteristics, obtain 12-lead ECG within 10 minutes, establish IV access, administer aspirin (300mg), and provide supplemental oxygen if SpO2 < 94%. Transport to PCI-capable facility if available.",
    area: "cardiac",
  },
  {
    title: "Cardiac Arrest Management",
    summary: "High-quality CPR and defibrillation protocols for out-of-hospital cardiac arrest",
    guidance: "Start chest compressions immediately at 100-120/min, minimize interruptions, defibrillate shockable rhythms promptly, establish IV/IO access, administer epinephrine every 3-5 minutes, consider amiodarone for VF/VT, and provide post-resuscitation care.",
    area: "cardiac",
  },
  {
    title: "Atrial Fibrillation with Rapid Ventricular Response",
    summary: "Managing symptomatic atrial fibrillation in the prehospital setting",
    guidance: "Assess stability and oxygenation, obtain 12-lead ECG, establish IV access, consider IV calcium channel blocker or beta-blocker for stable patients, provide supplemental oxygen as needed, and transport for hospital evaluation.",
    area: "cardiac",
  },
  {
    title: "Heart Failure Exacerbation",
    summary: "Recognizing and treating acute decompensated heart failure",
    guidance: "Position upright, provide high-flow oxygen to maintain SpO2 >94%, establish IV access, consider diuretics for pulmonary edema, assess for need of vasodilators, monitor vital signs, and provide supportive transport.",
    area: "cardiac",
  },
  {
    title: "Hypertensive Emergency",
    summary: "Managing severely elevated blood pressure in the field",
    guidance: "Assess for end-organ damage, establish IV access, monitor continuously, consider controlled reduction in BP, avoid aggressive lowering initially, and transport for physician evaluation.",
    area: "cardiac",
  },

  // Trauma
  {
    title: "Penetrating Chest Trauma",
    summary: "Management of penetrating wounds to the chest",
    guidance: "Seal open pneumothorax immediately, establish two large-bore IVs, provide high-flow oxygen, monitor for tension pneumothorax, perform needle decompression if needed, and expedite transport to trauma center.",
    area: "trauma",
  },
  {
    title: "Abdominal Trauma with Evisceration",
    summary: "Handling exposed abdominal organs in blunt and penetrating trauma",
    guidance: "Do NOT attempt to reinsert organs. Cover with clean, moist sterile dressing. Apply gentle pressure to control bleeding. Establish IV access, provide oxygen, immobilize patient, and expedite transport.",
    area: "trauma",
  },
  {
    title: "Pelvic Fracture Management",
    summary: "Recognition and stabilization of pelvic fractures",
    guidance: "Immobilize pelvis with pelvic binder, establish IV access, provide high-flow oxygen, keep patient NPO, monitor for internal bleeding, consider early notification of trauma center, and transport expeditiously.",
    area: "trauma",
  },
  {
    title: "Extremity Amputation",
    summary: "Management of traumatic amputation of limbs",
    guidance: "Control hemorrhage with direct pressure and tourniquet if needed. Recover amputated part, wrap in clean saline-soaked gauze, place in plastic bag, keep on ice. Establish IVs, provide oxygen, and expedite transport.",
    area: "trauma",
  },
  {
    title: "Crush Injuries and Compartment Syndrome",
    summary: "Recognition and management of crush injuries and developing compartment syndrome",
    guidance: "Document time of injury, assess neurovascular status, provide pain control, establish IV access, prepare for rapid transport, monitor for rhabdomyolysis complications, and communicate with hospital for early intervention.",
    area: "trauma",
  },

  // Respiratory
  {
    title: "Severe Asthma Exacerbation",
    summary: "Management of acute asthma attack with respiratory distress",
    guidance: "Sit patient upright, provide high-flow oxygen, establish IV access, administer bronchodilators via inhaler or nebulizer, consider systemic corticosteroids, prepare for possible intubation, and provide reassurance.",
    area: "respiratory",
  },
  {
    title: "COPD Exacerbation",
    summary: "Treating acute exacerbation of chronic obstructive pulmonary disease",
    guidance: "Assess SpO2 carefully, provide controlled oxygen (target SpO2 88-92%), establish IV access, administer bronchodilators, consider steroids, monitor respiratory status, and transport for physician evaluation.",
    area: "respiratory",
  },
  {
    title: "Anaphylaxis with Respiratory Compromise",
    summary: "Managing anaphylaxis with airway and breathing difficulties",
    guidance: "Position airway, provide 100% oxygen, establish IV access immediately, administer IM epinephrine (0.3-0.5mg), prepare for intubation, give IV antihistamines and steroids, and expedite transport.",
    area: "respiratory",
  },
  {
    title: "Foreign Body Aspiration",
    summary: "Recognition and management of inhaled foreign bodies",
    guidance: "Assess severity of obstruction, provide high-flow oxygen, attempt gentle back blows and chest thrusts for infants, provide reassurance, do not agitate patient, and expedite transport to facility with appropriate removal equipment.",
    area: "respiratory",
  },
  {
    title: "Tension Pneumothorax",
    summary: "Rapidly recognizing and treating tension pneumothorax",
    guidance: "Recognize tracheal deviation, hypotension, and unilateral absent breath sounds. Perform needle decompression immediately in 2nd intercostal space midclavicular line, establish IV access, provide oxygen, monitor response, and transport urgently.",
    area: "respiratory",
  },

  // Neurological
  {
    title: "Acute Ischemic Stroke Recognition",
    summary: "Identifying potential stroke candidates and initiating rapid transport",
    guidance: "Use FAST assessment (Face, Arms, Speech, Time). Note exact time of symptom onset. Establish IV access, obtain glucose level, provide oxygen if SpO2 <94%, avoid oral intake, and expedite transport to stroke center.",
    area: "neurological",
  },
  {
    title: "Intracranial Hemorrhage Management",
    summary: "Managing suspected intracranial hemorrhage from trauma or medical causes",
    guidance: "Maintain head-of-bed elevation 30 degrees, establish IV access cautiously, provide oxygen, control pain and anxiety, maintain normothermia, monitor neuro status, and transport to trauma/stroke center.",
    area: "neurological",
  },
  {
    title: "Seizure Management",
    summary: "Recognizing and treating active and post-ictal seizures",
    guidance: "Protect airway, provide oxygen, establish IV access after seizure, administer benzodiazepines if seizing, monitor for repeated seizures, place in recovery position, and transport for evaluation.",
    area: "neurological",
  },
  {
    title: "Altered Mental Status Investigation",
    summary: "Systematic approach to patients with decreased consciousness",
    guidance: "Obtain glucose immediately, assess AVPU/GCS, obtain history, check vital signs, establish IV access, provide oxygen, consider causes (AEIOU-TIPS), and transport appropriately.",
    area: "neurological",
  },
  {
    title: "Status Epilepticus",
    summary: "Managing prolonged or repeated seizures",
    guidance: "Establish IV/IO access immediately, provide oxygen, administer benzodiazepines, prepare for intubation, monitor for aspiration, establish cardiac monitoring, and expedite transport.",
    area: "neurological",
  },

  // Obstetrics
  {
    title: "Complicated Childbirth in the Field",
    summary: "Managing deliveries when mother cannot reach hospital",
    guidance: "Maintain sterile field, support delivery of baby, allow normal progression, do not pull on umbilical cord, clamp and cut cord, deliver placenta, keep newborn warm, and arrange rapid transport.",
    area: "obstetrics",
  },
  {
    title: "Severe Preeclampsia and Eclampsia",
    summary: "Recognition and management of hypertensive emergency in pregnancy",
    guidance: "Recognize headache, visual changes, and seizures. Establish IV access, provide oxygen, monitor BP carefully, have magnesium sulfate available, keep quiet environment, and expedite transport.",
    area: "obstetrics",
  },
  {
    title: "Obstetric Hemorrhage",
    summary: "Managing postpartum and antepartum hemorrhage",
    guidance: "Identify source of bleeding, establish two large-bore IVs, massage uterus, administer oxytocin if available, keep patient warm, monitor vitals, provide high-flow oxygen, and expedite transport.",
    area: "obstetrics",
  },
  {
    title: "Amniotic Fluid Embolism",
    summary: "Rare but life-threatening complication during labor",
    guidance: "Recognize sudden onset dyspnea, chest pain, and cardiovascular collapse. Provide 100% oxygen, establish IV access, provide CPR if needed, consider vasopressors, and expedite to hospital.",
    area: "obstetrics",
  },
  {
    title: "Placental Abruption",
    summary: "Managing premature placental separation during pregnancy",
    guidance: "Recognize vaginal bleeding and abdominal pain. Establish IV access, provide oxygen, monitor mother and fetal heart tones if possible, keep NPO, and expedite transport.",
    area: "obstetrics",
  },

  // Pediatrics
  {
    title: "Pediatric Respiratory Distress",
    summary: "Recognition and management of respiratory distress in children",
    guidance: "Assess work of breathing, provide supplemental oxygen, position for comfort, establish IV/IO access cautiously, consider nebulized medications, prepare for intubation, and transport with monitoring.",
    area: "pediatrics",
  },
  {
    title: "Febrile Seizure in Infants and Children",
    summary: "Managing seizures associated with fever in young children",
    guidance: "Cool child gradually (sponging, cooling measures), obtain temperature, assess for meningitis signs, establish IV access, administer benzodiazepines if still seizing, and transport for evaluation.",
    area: "pediatrics",
  },
  {
    title: "Acute Epiglottitis",
    summary: "Managing airway emergency from epiglottic swelling",
    guidance: "Do NOT agitate child or examine throat. Maintain position of comfort, provide high-flow oxygen, do not attempt intubation in field, establish IV access, and expedite transport to operating room.",
    area: "pediatrics",
  },
  {
    title: "Croup Management",
    summary: "Treating laryngeal inflammation and stridor in children",
    guidance: "Cool, humidified oxygen helps significantly. Reassure parent and child. Consider dexamethasone. Do not agitate child. Establish IV access if possible, and transport if respiratory distress worsening.",
    area: "pediatrics",
  },
  {
    title: "Pediatric Sepsis Recognition",
    summary: "Early identification of sepsis in children for rapid intervention",
    guidance: "Recognize fever, altered mental status, tachycardia, poor perfusion. Establish IV/IO access, provide high-flow oxygen, draw blood cultures if trained, provide fluids, and expedite transport.",
    area: "pediatrics",
  },

  // Operations
  {
    title: "Mass Casualty Incident Triage",
    summary: "Rapid triage systems for multiple patients at incident",
    guidance: "Use START (Simple Triage and Rapid Treatment) system. Assess respiratory status, perfusion, mental status. Tag patients appropriately and direct to treatment areas or transport.",
    area: "operations",
  },
  {
    title: "Hazardous Material Scene Safety",
    summary: "Paramedic response to hazardous material exposures",
    guidance: "Do NOT enter contaminated area without proper protective equipment. Establish hot/warm/cold zones. Decontamination before treatment. Wear appropriate PPE. Involve hazmat team and poison control.",
    area: "operations",
  },
  {
    title: "Vehicle Extrication Principles",
    summary: "Understanding extrication process and care during removal",
    guidance: "Maintain cervical spine precautions during extraction. Coordinate with fire department. Minimize patient movement. Protect from environmental hazards. Provide pain control and reassurance.",
    area: "operations",
  },
  {
    title: "Tactical Emergency Medical Support (TEMS)",
    summary: "Providing medical care in law enforcement tactical operations",
    guidance: "Wear tactical gear, maintain awareness of threat environment, provide care from cover, prepare for multiple casualties, communicate with command, and establish treatment areas.",
    area: "operations",
  },
  {
    title: "Pandemic and Infectious Disease Response",
    summary: "Paramedic precautions and protocols during disease outbreaks",
    guidance: "Use appropriate PPE based on transmission type. Follow isolation precautions. Communicate risks to receiving facility. Decontaminate equipment. Follow public health guidance.",
    area: "operations",
  },
];

async function seed() {
  console.log("Seeding topics...");
  try {
    // Insert all topics
    const result = await db.insert(topics).values(
      seedTopics.map((t) => ({
        ...t,
        createdBy: "system",
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );

    console.log(`✓ Successfully seeded ${seedTopics.length} topics`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding topics:", error);
    process.exit(1);
  }
}

seed();
