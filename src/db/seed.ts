import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { topics, sources, subscriptions, notifications, type Area } from "./schema";

type SeedTopic = {
  title: string;
  summary: string;
  guidance: string;
  area: Area;
  rationale: string;
  createdBy: string;
};

const SEED_TOPICS: SeedTopic[] = [
  // ── CARDIAC ───────────────────────────────────────────────────────────
  {
    title: "Adult Cardiac Arrest — Field ROSC Management",
    summary:
      "Sustained ROSC after out-of-hospital cardiac arrest requires aggressive post-resuscitation care to prevent re-arrest and protect neurological recovery.",
    area: "cardiac",
    guidance:
      "Maintain SpO2 94–98% — avoid both hypoxia and hyperoxia. Target end-tidal CO2 35–40 mmHg; do not hyperventilate. Acquire a 12-lead ECG within 10 minutes of ROSC and transmit to a PCI-capable receiving facility. Treat hypotension to a MAP ≥65 mmHg with crystalloid and a noradrenaline infusion if needed. Reassess airway, breathing, circulation, and neurological status every 5 minutes en route. Prepare for re-arrest: pads remain attached, defibrillator armed, drugs drawn.",
    rationale:
      "Hyperoxia and hyperventilation after ROSC are independently associated with worse neurological outcomes (Bellomo 2011; Helmerhorst 2015). Early PCI improves survival in shockable rhythms with STEMI on the post-ROSC ECG.",
    createdBy: "dr.amin",
  },
  {
    title: "STEMI Recognition and Pre-Hospital Cath Lab Activation",
    summary:
      "ST-elevation myocardial infarction is a time-critical condition where field 12-lead ECG and direct PCI activation save myocardium and lives.",
    area: "cardiac",
    guidance:
      "Acquire a 12-lead ECG within 10 minutes of patient contact for any chest pain, dyspnoea, syncope, epigastric pain, or anginal-equivalent symptom. Transmit the trace to the receiving facility and request cath lab activation if STEMI criteria are met (≥1 mm ST elevation in two contiguous limb leads or ≥2 mm in two contiguous chest leads). Aspirin 300 mg PO chewed unless allergic or actively bleeding. Avoid GTN in suspected inferior MI with right ventricular involvement (V4R lead) — preload-dependent hypotension may follow.",
    rationale:
      "Pre-hospital cath lab activation reduces door-to-balloon time by 30–60 minutes and improves 1-year mortality (Diercks 2009). Inferior STEMI with RV involvement is the classic preload-sensitive case where GTN can crash blood pressure.",
    createdBy: "system",
  },
  {
    title: "Symptomatic Bradycardia",
    summary:
      "Bradycardia with poor perfusion needs prompt rate support — atropine first, transcutaneous pacing for refractory or high-grade AV blocks.",
    area: "cardiac",
    guidance:
      "Treat HR <50 bpm only if symptomatic: hypotension, altered mental status, ischaemic chest pain, signs of shock. Atropine 500 mcg IV every 3–5 minutes, maximum 3 mg. If atropine fails or the rhythm is Mobitz II / complete heart block, prepare transcutaneous pacing at 60–80 bpm — confirm electrical AND mechanical capture by palpating a pulse synchronous with the pacing spike. Adrenaline 2–10 mcg/min IV infusion is an alternative bridge to definitive care.",
    rationale:
      "Atropine is unreliable in high-grade AV blocks because the block is below the AV node where vagal tone has little effect; pacing or chronotropic infusion is the bridge to definitive electrophysiology.",
    createdBy: "dr.amin",
  },

  // ── TRAUMA ────────────────────────────────────────────────────────────
  {
    title: "Major Trauma Triage and Transport Destination",
    summary:
      "Patients meeting major-trauma criteria require direct transport to a designated trauma centre, bypassing nearer non-trauma hospitals.",
    area: "trauma",
    guidance:
      "Apply the regional trauma triage tool. Step 1 (vital signs): GCS ≤13, SBP <90, RR <10 or >29, or need for ventilatory support. Step 2 (anatomic): penetrating injuries to head/neck/torso/proximal limbs, flail chest, two or more long-bone fractures, crushed/degloved/mangled extremity, amputation proximal to wrist/ankle, pelvic fracture, open or depressed skull fracture, paralysis. Bypass non-trauma hospitals if a trauma centre is within reasonable transport time. Consider HEMS if ground transport >30 minutes.",
    rationale:
      "Direct triage to a Level I/II trauma centre reduces 30-day mortality by approximately 25% in severely injured patients (MacKenzie 2006, NEJM).",
    createdBy: "paramedic.kovac",
  },
  {
    title: "Tourniquet Application for Severe Extremity Haemorrhage",
    summary:
      "Life-threatening extremity bleeding warrants immediate tourniquet placement — do not waste time on direct pressure for clearly arterial wounds.",
    area: "trauma",
    guidance:
      "Apply the tourniquet 5–7 cm proximal to the wound, never directly over a joint. Tighten until bleeding stops AND distal pulse is absent. Mark the application time clearly on the tourniquet AND on the patient (forehead). If bleeding continues, place a second tourniquet immediately proximal to the first. Do not loosen prophylactically. Document tourniquet time at handover; the receiving team needs it for limb-salvage decisions.",
    rationale:
      "Battlefield and civilian data show tourniquets reduce mortality from extremity haemorrhage with negligible limb loss when applied for under 2 hours (Kragh 2009). Most reported limb loss after tourniquet use was caused by the underlying injury, not ischaemia from the tourniquet.",
    createdBy: "paramedic.kovac",
  },
  {
    title: "Suspected Tension Pneumothorax — Needle Decompression",
    summary:
      "Tension pneumothorax is a clinical diagnosis; immediate needle thoracostomy is life-saving in a patient with shock plus unilateral breath-sound loss.",
    area: "trauma",
    guidance:
      "Insert a 14G × 8 cm cannula in the 4th–5th intercostal space, mid-axillary line (preferred over the 2nd ICS midclavicular site in adults due to chest-wall thickness). Listen for the hiss of escaping air; secure the cannula. Reassess immediately — if no improvement, repeat on the contralateral side or in a different intercostal space. Expect re-tensioning after needle dislodgement; finger thoracostomy is the definitive pre-hospital intervention where the crew is trained.",
    rationale:
      "The mid-axillary 4th–5th ICS site has a higher success rate in adult patients than the classic 2nd ICS midclavicular site because the lateral chest wall is thinner, and an 8 cm needle reaches the pleura in over 95% of adults (Inaba 2012).",
    createdBy: "system",
  },

  // ── RESPIRATORY ───────────────────────────────────────────────────────
  {
    title: "Acute Severe Asthma in Adults",
    summary:
      "Severe asthma exacerbation needs early continuous bronchodilation, systemic steroids, and recognition of impending respiratory failure.",
    area: "respiratory",
    guidance:
      "Salbutamol 5 mg + ipratropium 500 mcg via O2-driven nebuliser, repeated back-to-back. Hydrocortisone 200 mg IV or prednisolone 50 mg PO. Magnesium sulphate 2 g IV over 20 minutes for life-threatening features (silent chest, exhaustion, SpO2 <92% on air, PEF <33% best/predicted, altered consciousness). Prepare for assisted ventilation, but avoid intubation unless arrest is imminent — periarrest asthmatics tolerate induction poorly.",
    rationale:
      "IV magnesium sulphate reduces hospital admission in severe asthma not responding to first-line treatment (Cochrane 2014). Asthma intubation carries a high rate of haemodynamic collapse and barotrauma.",
    createdBy: "paramedic.lee",
  },
  {
    title: "COPD Acute Exacerbation",
    summary:
      "Hypoxic patients with known COPD need controlled oxygen titrated to SpO2 88–92% to avoid worsening hypercapnia and CO2 narcosis.",
    area: "respiratory",
    guidance:
      "Start with 24–28% via Venturi mask and titrate to SpO2 88–92% — NOT 94–98%. Salbutamol 5 mg + ipratropium 500 mcg nebulised; use compressed air or low-flow O2 if available. Prednisolone 30 mg PO if alert; hydrocortisone 100 mg IV otherwise. Consider non-invasive ventilation (BiPAP) for hypercapnic respiratory failure with pH <7.35.",
    rationale:
      "Uncontrolled high-flow oxygen in COPD increases mortality from 9% to 4% when titrated (Austin 2010, BMJ). Hypercapnic patients depend on hypoxic respiratory drive; hyperoxia suppresses ventilation and worsens acidosis.",
    createdBy: "paramedic.lee",
  },
  {
    title: "Anaphylaxis with Airway Compromise",
    summary:
      "Adrenaline IM is the first and most important intervention in anaphylaxis — delays kill.",
    area: "respiratory",
    guidance:
      "Adrenaline 500 mcg (0.5 mg) IM into the lateral thigh in adults, repeated every 5 minutes if needed. High-flow O2 via non-rebreather. IV access; crystalloid bolus 500–1000 mL for hypotension. Hydrocortisone 200 mg IV and chlorphenamine 10 mg IV are second-line and never substitutes for adrenaline. Prepare for a difficult airway — laryngeal oedema progresses fast.",
    rationale:
      "Delayed adrenaline administration is the strongest single predictor of fatal outcome in anaphylaxis (Pumphrey 2000); IV antihistamines alone do not reverse airway oedema or hypotension.",
    createdBy: "system",
  },

  // ── NEUROLOGICAL ──────────────────────────────────────────────────────
  {
    title: "Stroke Recognition and Hyperacute Pathway Activation",
    summary:
      "Suspected stroke requires rapid recognition, last-known-well documentation, and direct transport to a hyperacute stroke centre.",
    area: "neurological",
    guidance:
      "Apply FAST or BE-FAST (Balance, Eyes added to Face, Arms, Speech, Time). Document precise last-known-well time — NOT discovery time. Capillary blood glucose on every suspected stroke to exclude hypoglycaemia. Bypass non-stroke centres if within the thrombolysis (4.5 h) or thrombectomy (24 h) window. Pre-notify the receiving hospital. Do not lower BP unless >220/120 mmHg.",
    rationale:
      "Every 15 minutes of faster reperfusion increases the proportion of patients living independently; pre-notification halves door-to-needle time (Fonarow 2011, Circulation).",
    createdBy: "system",
  },
  {
    title: "Tonic-Clonic Seizure and Status Epilepticus",
    summary:
      "First-line in active seizure is a benzodiazepine; status epilepticus is a true emergency at 5+ minutes of continuous activity.",
    area: "neurological",
    guidance:
      "Protect airway and surroundings; do not insert anything into the mouth. After 5 minutes of continuous activity (status epilepticus), give midazolam 10 mg buccal/IM or diazepam 10 mg PR. Repeat once after 5–10 minutes if seizure persists. Capillary glucose; treat hypoglycaemia. Transport for definitive care; consider levetiracetam 60 mg/kg IV (max 4.5 g) for prolonged transport where protocols allow.",
    rationale:
      "Mortality in status epilepticus increases with duration; pre-hospital benzodiazepines reduce ICU admission compared with delayed in-hospital treatment (RAMPART trial 2012).",
    createdBy: "paramedic.lee",
  },
  {
    title: "Suspected Spinal Cord Injury — Selective Spinal Motion Restriction",
    summary:
      "Modern guidance favours selective spinal motion restriction over routine immobilisation in alert patients without neurological deficit or distracting injury.",
    area: "neurological",
    guidance:
      "Apply NEXUS or Canadian C-spine criteria. Full spinal precautions (collar + scoop + headblocks) only if the patient has midline tenderness, focal neurological deficit, intoxication, distracting injury, altered mental status, or a high-risk mechanism. Otherwise allow self-extrication and transport semi-recumbent. Avoid routine log-rolling; use a scoop stretcher where possible.",
    rationale:
      "Backboards cause pressure injury and impair respiration; routine use without clinical indication has no evidence of benefit (NAEMSP/ACSCOT joint position 2013).",
    createdBy: "system",
  },

  // ── OBSTETRICS ────────────────────────────────────────────────────────
  {
    title: "Imminent Field Birth",
    summary:
      "Crowning means delivery is imminent; prepare for normal birth, with attention to cord position and shoulder dystocia.",
    area: "obstetrics",
    guidance:
      "Position the mother semi-recumbent with knees flexed. Support the perineum and apply gentle counter-pressure to the head as it crowns to control delivery. Check for the cord around the neck — slip it over the head, or clamp and cut if too tight. After delivery: dry vigorously, delay cord clamping by 1–3 minutes. Deliver the placenta and massage the uterus until firm. Record time of delivery, infant sex, and APGAR scores at 1 and 5 minutes.",
    rationale:
      "Delayed cord clamping increases neonatal iron stores and reduces transfusion need (WHO 2014). Routine episiotomy is contraindicated in normal field birth.",
    createdBy: "rn.bjornson",
  },
  {
    title: "Postpartum Haemorrhage — Field Management",
    summary:
      "PPH is the leading cause of maternal mortality worldwide; uterine massage, fluid resuscitation, and tranexamic acid are the field essentials.",
    area: "obstetrics",
    guidance:
      "Recognise PPH: estimated blood loss >500 mL, signs of shock, or persistent bleeding after placental delivery. Bimanual uterine massage. Two large-bore IVs; cautious fluid resuscitation (target SBP 90 mmHg). Tranexamic acid 1 g IV slowly over 10 minutes within 3 hours of bleeding onset. Consider misoprostol or oxytocin if carried by service. Rapid transport with pre-alert — this is a peri-arrest scenario.",
    rationale:
      "TXA given within 3 hours of bleeding onset reduces death from PPH by approximately 30% (WOMAN trial, Lancet 2017).",
    createdBy: "rn.bjornson",
  },
  {
    title: "Pre-Eclampsia and Eclamptic Seizure",
    summary:
      "New-onset BP >140/90 with proteinuria or warning features in the second half of pregnancy is pre-eclampsia; magnesium sulphate prevents and treats eclampsia.",
    area: "obstetrics",
    guidance:
      "Assess BP, hyperreflexia, headache, visual disturbance, RUQ pain, and peripheral oedema. If a seizure occurs, protect the airway and give magnesium sulphate 4 g IV over 5–10 minutes, then 1 g/h infusion. Do not use diazepam as first line in eclampsia. Lower BP only if SBP >160 or DBP >110, using labetalol or hydralazine. Position laterally to prevent aortocaval compression.",
    rationale:
      "Magnesium sulphate halves the recurrence of eclamptic seizures and reduces maternal death compared with benzodiazepines or phenytoin (Magpie trial, Lancet 2002).",
    createdBy: "system",
  },

  // ── PEDIATRICS ────────────────────────────────────────────────────────
  {
    title: "Pediatric Anaphylaxis",
    summary:
      "Weight-based adrenaline IM is the first intervention; do not delay for IV access or antihistamines.",
    area: "pediatrics",
    guidance:
      "Adrenaline 10 mcg/kg IM (maximum 500 mcg) into the lateral thigh; auto-injector if available (150 mcg <30 kg, 300 mcg ≥30 kg). Repeat every 5 minutes if needed. High-flow O2; crystalloid bolus 20 mL/kg for hypotension. Hydrocortisone 4 mg/kg IV and chlorphenamine 0.2 mg/kg IV are adjuncts only. Always transport — biphasic reactions occur in 5–20% of children.",
    rationale:
      "Fatal anaphylaxis in children is most strongly associated with delayed adrenaline (Pumphrey 2007). Antihistamines are too slow to address airway oedema.",
    createdBy: "rn.bjornson",
  },
  {
    title: "Febrile Seizure in Children",
    summary:
      "Simple febrile seizures (<15 min, generalised, single in 24 h) are usually benign; the goal is reassurance and ruling out CNS infection.",
    area: "pediatrics",
    guidance:
      "Cool the child gently — remove excess clothing; do not sponge or use ice. Antipyretic (paracetamol 15 mg/kg PO/PR) does not stop the seizure but improves comfort. If seizure activity exceeds 5 minutes, give midazolam 0.3 mg/kg buccal or intranasal (max 10 mg). Always transport for assessment to exclude meningitis, especially in children under 18 months. Check capillary glucose.",
    rationale:
      "Simple febrile seizures are benign in otherwise well children (NICE CG143), but meningitis cannot be excluded clinically in infants under 12 months.",
    createdBy: "rn.bjornson",
  },
  {
    title: "Pediatric Trauma Triage and Hypothermia Prevention",
    summary:
      "Children compensate physiologically until late; any child meeting mechanism criteria warrants pediatric trauma centre transport even if vitals appear normal.",
    area: "pediatrics",
    guidance:
      "Use age-specific normal vital sign ranges (HR/RR vary widely by age). Mechanism triggers: falls greater than twice the child's height, ejection, fatality in same vehicle, prolonged extrication, pedestrian/cyclist struck >32 km/h. Direct transport to a designated pediatric trauma centre per regional plan. Aggressively maintain normothermia with blankets and a warmed compartment — children cool fast and hypothermia worsens trauma coagulopathy.",
    rationale:
      "Children's larger body-surface-area-to-mass ratio causes faster heat loss; pediatric trauma mortality is lower at high-volume pediatric centres (Densmore 2006).",
    createdBy: "system",
  },

  // ── OPERATIONS ────────────────────────────────────────────────────────
  {
    title: "Mass Casualty Incident — START Triage",
    summary:
      "When patients outnumber resources, the goal shifts from individual care to maximising survivors using a fast structured triage tool.",
    area: "operations",
    guidance:
      "First crew on scene: declare MCI, request resources, and begin triage — do not start treatment yet. Use START (Simple Triage and Rapid Treatment): walking wounded = GREEN. Then assess respirations, perfusion (radial pulse or capillary refill), and mental status. RED (immediate), YELLOW (delayed), GREEN (minor), BLACK (deceased/expectant). Re-triage as resources arrive. Establish a casualty clearing point, ambulance loading point, and a clear command structure.",
    rationale:
      "START prioritises rapid sorting (<60 seconds per patient) over precise diagnosis and is well-validated for civilian MCIs (Super 1994).",
    createdBy: "dr.amin",
  },
  {
    title: "Helicopter Landing Zone Setup",
    summary:
      "Safe HEMS operations depend on a clear, marked landing zone; ground crew control approach and ensure scene safety.",
    area: "operations",
    guidance:
      "Minimum 30 m × 30 m clear of overhead wires, trees, and debris. Surface firm and level (slope <5°). Mark corners with vehicles or cones; lights at night must point AWAY from the aircraft (no white lights toward the pilot). Brief patient and bystanders on the tail-rotor exclusion zone — always approach from the 10 to 2 o'clock position under pilot direction. Secure all loose items. Communicate wind direction to the pilot.",
    rationale:
      "Tail-rotor strikes and unsecured-debris ingestion are the two leading HEMS ground-incident hazards (NTSB safety reviews).",
    createdBy: "system",
  },
  {
    title: "Patient Handover at Hospital — IMIST-AMBO",
    summary:
      "A structured 60–90 second handover preserves the receiving team's situational awareness; freeform handovers lose roughly 30% of clinical data.",
    area: "operations",
    guidance:
      "Use IMIST-AMBO or ATMIST: Identification (age/sex), Mechanism / medical complaint, Injuries / Information found, Signs (vitals trend), Treatment given — plus Allergies, Medications, Background (PMH), Other (social, NOK). One paramedic speaks; the receiving team holds questions until the end. Hand over in front of the patient where possible. Document the handover time.",
    rationale:
      "Structured handover reduces information loss and downstream adverse events (Iedema 2012). Resus teams cite background noise as the top barrier — pause noise during the handover.",
    createdBy: "system",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Did you copy .env.example to .env.local and start docker compose?"
    );
    process.exit(1);
  }

  const client = postgres(url);
  const db = drizzle(client);

  console.log(`Connecting to ${url.replace(/:[^:@]+@/, ":****@")}…`);

  try {
    const inserted = await db.transaction(async (tx) => {
      // Delete in FK-dependency order: rows that reference topics first.
      const clearedNotifications = await tx
        .delete(notifications)
        .returning({ id: notifications.id });
      const clearedSubscriptions = await tx
        .delete(subscriptions)
        .returning({ topicId: subscriptions.topicId });
      const clearedSources = await tx.delete(sources).returning({ id: sources.id });
      const clearedTopics = await tx.delete(topics).returning({ id: topics.id });

      console.log(
        `Cleared ${clearedTopics.length} topic(s), ${clearedSources.length} source(s), ${clearedSubscriptions.length} subscription(s), ${clearedNotifications.length} notification(s).`
      );

      return tx.insert(topics).values(SEED_TOPICS).returning({ id: topics.id });
    });

    console.log(`Inserted ${inserted.length} seed topics across all areas.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
