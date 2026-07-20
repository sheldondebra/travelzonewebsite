<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class LessonSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPharmacology();
        $this->seedMedicalSurgical();
        $this->seedPaediatric();
        $this->seedMentalHealth();
        $this->seedAdvancedNursing();
        $this->seedAnatomy();
        $this->seedObstetrics();
    }

    private function seedPharmacology(): void
    {
        $course = Course::query()->where('slug', 'pharmacology')->first();
        if (! $course) {
            return;
        }

        $course->update([
            'title' => 'Pharmacology Nursing',
            'description' => 'Master the principles of drugs and their safe, effective use in nursing practice.',
            'icon' => 'pharmacy',
            'icon_bg' => '#EDE9FE',
            'outline_url' => '#',
        ]);

        $lessons = [
            ['Introduction to Pharmacology', 'Overview of basic pharmacology concepts, drug sources, classifications, and important terminology used in nursing practice.', 765],
            ['Drug Classifications', 'Explore major drug classes, therapeutic categories, and how classifications guide safe prescribing and administration.', 1090],
            ['Pharmacokinetics', 'Understand absorption, distribution, metabolism, and excretion and their impact on drug action.', 1350],
            ['Pharmacodynamics', 'Learn how drugs interact with receptors and produce therapeutic and adverse effects.', 1185],
            ['Medication Safety', 'Apply the rights of medication administration and error-prevention strategies in clinical practice.', 980],
            ['Adverse Drug Reactions', 'Identify common adverse reactions, monitoring requirements, and nursing interventions.', 895],
            ['Cardiovascular Medications', 'Review antihypertensives, antiarrhythmics, and heart failure medications with nursing considerations.', 1275],
            ['Antimicrobial Agents', 'Study antibiotic classes, resistance patterns, and stewardship principles for nurses.', 1240],
            ['Pain Management Drugs', 'Examine analgesics, adjuvant therapies, and safe opioid monitoring protocols.', 1050],
            ['Endocrine Medications', 'Cover insulin, oral hypoglycemics, and thyroid medications with patient education focus.', 1140],
            ['Respiratory Medications', 'Understand bronchodilators, corticosteroids, and inhaler administration techniques.', 1020],
            ['Gastrointestinal Drugs', 'Review antiemetics, antacids, and bowel regimen medications used in acute care.', 960],
            ['Psychotropic Medications', 'Learn nursing care for patients receiving antidepressants, antipsychotics, and anxiolytics.', 1110],
            ['Pediatric Dosing Principles', 'Apply weight-based dosing and safety checks for pediatric medication administration.', 930],
            ['Geriatric Pharmacology', 'Address polypharmacy, altered pharmacokinetics, and fall-risk medications in older adults.', 1005],
            ['Clinical Application & Review', 'Integrate pharmacology knowledge through case studies and NCLEX-style review questions.', 1200],
        ];

        $this->syncLessons($course, $lessons);
    }

    private function seedMedicalSurgical(): void
    {
        $course = Course::query()->where('slug', 'adult-medical-surgical-nursing')->first();
        if (! $course) {
            return;
        }

        $course->update([
            'title' => 'Adult Medical-Surgical Nursing',
            'description' => 'Comprehensive care across the adult lifespan for medical and surgical conditions.',
            'icon' => 'surgical',
            'icon_bg' => '#DCFCE7',
            'outline_url' => '#',
        ]);

        $lessons = [
            ['Overview of Medical-Surgical Nursing', 'Introduction to the role of the medical-surgical nurse, scope of practice, and the nursing process in adult care.', 924],
            ['The Nursing Process in Acute Care', 'Apply assessment, diagnosis, planning, implementation, and evaluation in medical-surgical settings.', 870],
            ['Health Assessment & Physical Examination', 'Perform focused and comprehensive assessments for adults with acute and chronic conditions.', 1020],
            ['Infection Prevention & Control', 'Implement evidence-based infection control practices and isolation precautions.', 780],
            ['Perioperative Nursing Care', 'Support patients through preoperative, intraoperative, and postoperative phases of care.', 960],
            ['Pain Management in Acute Care', 'Assess pain using validated tools and implement pharmacologic and non-pharmacologic interventions.', 840],
            ['Fluid and Electrolyte Balance', 'Monitor fluid status, interpret lab values, and manage imbalances in hospitalized adults.', 1090],
            ['Acid-Base Balance', 'Recognize acid-base disturbances and collaborate on corrective nursing interventions.', 930],
            ['Cardiovascular Disorders', 'Care for patients with hypertension, heart failure, arrhythmias, and ischemic heart disease.', 1140],
            ['Respiratory Disorders', 'Manage oxygen therapy, airway clearance, and monitoring for pulmonary conditions.', 1080],
            ['Gastrointestinal Disorders', 'Support patients with GI bleeding, obstruction, liver disease, and postoperative recovery.', 990],
            ['Renal & Urologic Disorders', 'Address fluid restrictions, dialysis considerations, and urologic postoperative care.', 960],
            ['Neurologic Disorders', 'Monitor neurologic status, seizure precautions, and stroke recovery nursing care.', 1050],
            ['Musculoskeletal Disorders', 'Promote mobility, fracture care, and rehabilitation after orthopedic procedures.', 900],
            ['Endocrine Disorders', 'Manage diabetes, thyroid disorders, and adrenal conditions in acute care settings.', 1020],
            ['Immune & Hematologic Disorders', 'Care for immunocompromised patients and those with anemia or clotting disorders.', 930],
            ['Oncology Nursing Care', 'Provide supportive care, symptom management, and patient education for oncology patients.', 1110],
            ['Clinical Integration & Review', 'Synthesize medical-surgical concepts through case studies and NCLEX-style review.', 1200],
        ];

        $this->syncLessons($course, $lessons);
    }

    private function seedPaediatric(): void
    {
        $course = Course::query()->where('slug', 'paediatric-nursing')->first();
        if (! $course) {
            return;
        }

        $course->update([
            'title' => 'Paediatric Nursing',
            'description' => 'Provide safe, developmentally appropriate care for infants, children and adolescents.',
            'icon' => 'paediatric',
            'icon_bg' => '#FCE7F3',
            'outline_url' => '#',
        ]);

        $lessons = [
            ['Overview of Paediatric Nursing', 'Introduction to paediatric nursing, growth and development, and the unique needs of children and their families.', 924],
            ['Growth and Development', 'Explore age-specific milestones, developmental theories, and nursing implications across childhood stages.', 1090],
            ['Family-Centered Care', 'Partner with families as caregivers and support culturally sensitive, holistic paediatric nursing practice.', 960],
            ['Pediatric Health Assessment', 'Perform developmentally appropriate assessments and recognize normal versus abnormal findings in children.', 1020],
            ['Immunization & Preventive Care', 'Apply immunization schedules, anticipatory guidance, and wellness promotion for pediatric populations.', 870],
            ['Common Childhood Illnesses', 'Identify signs, symptoms, and nursing management for frequently encountered paediatric conditions.', 990],
            ['Pediatric Respiratory Conditions', 'Care for children with asthma, bronchiolitis, croup, and other respiratory disorders.', 1080],
            ['Pediatric Cardiovascular Care', 'Monitor congenital and acquired heart conditions and support families through complex care plans.', 1050],
            ['Nutrition & Hydration in Children', 'Address feeding challenges, malnutrition risk, and fluid balance across developmental stages.', 930],
            ['Pain Management in Pediatrics', 'Use age-appropriate pain scales and implement safe, effective comfort measures for children.', 900],
            ['Pediatric Pharmacology Basics', 'Apply weight-based dosing, safe medication administration, and parent education for pediatric drugs.', 1020],
            ['Child Abuse & Neglect Recognition', 'Identify warning signs, reporting responsibilities, and trauma-informed nursing responses.', 840],
            ['Adolescent Health', 'Support mental health, reproductive health, and autonomy in adolescent patient populations.', 960],
            ['Neonatal Nursing Basics', 'Provide essential care for newborns, including thermoregulation, feeding, and early complication monitoring.', 1110],
            ['Pediatric Emergency Care', 'Respond to rapid assessment priorities in pediatric emergencies and resuscitation scenarios.', 1140],
            ['Clinical Integration & Review', 'Integrate paediatric nursing concepts through case studies and NCLEX-style review questions.', 1200],
        ];

        $this->syncLessons($course, $lessons);
    }

    private function seedMentalHealth(): void
    {
        $course = Course::query()->where('slug', 'mental-health-nursing')->first();
        if (! $course) {
            return;
        }

        $course->update([
            'title' => 'Mental Health Nursing',
            'description' => 'Promote mental well-being and provide compassionate, evidence-based care for individuals across the lifespan.',
            'icon' => 'mental-health',
            'icon_bg' => '#CCFBF1',
            'outline_url' => '#',
        ]);

        $lessons = [
            ['Overview of Mental Health Nursing', 'Introduction to mental health nursing, scope of practice, therapeutic communication, and the nursing process in mental health care.', 924],
            ['Therapeutic Communication', 'Develop active listening, empathy, and communication techniques that build trust in psychiatric settings.', 1090],
            ['Psychiatric Assessment', 'Conduct mental status examinations and recognize signs of acute psychiatric distress.', 1020],
            ['Mental Health Promotion', 'Apply primary prevention strategies and wellness education across community and clinical settings.', 930],
            ['Stress, Coping & Resilience', 'Support adaptive coping skills and identify maladaptive responses to life stressors.', 960],
            ['Mood Disorders', 'Care for patients with depression and bipolar disorder using safety-focused nursing interventions.', 1080],
            ['Anxiety & Trauma-Related Disorders', 'Manage anxiety disorders, PTSD, and panic symptoms with evidence-based nursing approaches.', 1050],
            ['Schizophrenia Spectrum Disorders', 'Understand positive and negative symptoms and implement structured, recovery-oriented care.', 1110],
            ['Substance Use Disorders', 'Apply nonjudgmental care, withdrawal monitoring, and relapse-prevention support.', 990],
            ['Personality Disorders', 'Set therapeutic boundaries and respond effectively to challenging interpersonal behaviors.', 870],
            ['Crisis Intervention & Suicide Prevention', 'Perform risk assessments and implement immediate safety plans for patients in crisis.', 1020],
            ['Psychopharmacology for Nurses', 'Monitor psychiatric medications, side effects, and patient education for common psychotropics.', 1140],
            ['Trauma-Informed Care', 'Deliver care that recognizes trauma history and avoids re-traumatization in clinical practice.', 900],
            ['Child & Adolescent Mental Health', 'Address developmental considerations in pediatric and adolescent psychiatric nursing care.', 960],
            ['Geriatric Mental Health', 'Recognize depression, dementia, and delirium presentations in older adult populations.', 930],
            ['Clinical Integration & Review', 'Integrate mental health nursing concepts through case studies and NCLEX-style review.', 1200],
        ];

        $this->syncLessons($course, $lessons);
    }

    private function seedAdvancedNursing(): void
    {
        $course = Course::query()->where('slug', 'advanced-nursing')->first();
        if (! $course) {
            return;
        }

        $course->update([
            'title' => 'Advanced Nursing Practice',
            'description' => 'Enhance clinical expertise, leadership, and evidence-based decision making to improve patient outcomes.',
            'icon' => 'advanced',
            'icon_bg' => '#EDE9FE',
            'outline_url' => '#',
        ]);

        $lessons = [
            ['Overview of Advanced Nursing Practice', 'Explore the role, scope, and core competencies of advanced practice nurses in today\'s healthcare system.', 980],
            ['Advanced Health Assessment', 'Perform comprehensive assessments and synthesize findings for complex clinical decision-making.', 1050],
            ['Evidence-Based Practice', 'Appraise research, integrate best evidence, and apply clinical guidelines in advanced nursing roles.', 990],
            ['Clinical Decision Making', 'Use critical thinking frameworks to prioritize care for patients with multifaceted health needs.', 930],
            ['Advanced Pharmacology', 'Apply advanced pharmacologic principles and monitoring for high-acuity patient populations.', 1080],
            ['Diagnostic Reasoning', 'Interpret diagnostic data and collaborate on differential diagnoses in advanced practice settings.', 1020],
            ['Leadership and Management', 'Lead interprofessional teams, delegate effectively, and manage unit-level nursing operations.', 1110],
            ['Quality Improvement & Safety', 'Design and evaluate quality initiatives that reduce harm and improve care delivery.', 960],
            ['Healthcare Policy & Advocacy', 'Analyze policy impacts on nursing practice and advocate for equitable patient access.', 900],
            ['Population Health Management', 'Coordinate preventive care and chronic disease management across diverse communities.', 1020],
            ['Interprofessional Collaboration', 'Build effective partnerships with physicians, allied health staff, and community providers.', 870],
            ['Ethics in Advanced Practice', 'Navigate ethical dilemmas, informed consent, and professional boundaries in complex cases.', 840],
            ['Health Informatics & Technology', 'Leverage EHRs, telehealth, and data tools to support advanced clinical workflows.', 930],
            ['Preceptorship & Mentorship', 'Guide novice nurses and foster professional development within clinical environments.', 960],
            ['Complex Case Management', 'Coordinate long-term care plans for patients with chronic, acute, and transitional needs.', 1140],
            ['Clinical Integration & Review', 'Integrate advanced nursing practice concepts through case studies and NCLEX-style review.', 1200],
        ];

        $this->syncLessons($course, $lessons);
    }

    private function seedAnatomy(): void
    {
        $course = Course::query()->where('slug', 'human-anatomy-and-physiology')->first();
        if (! $course) {
            return;
        }

        $course->update([
            'title' => 'Human Anatomy & Physiology',
            'description' => 'Explore the structure, organisation, and function of the human body to build a strong foundation for clinical nursing practice.',
            'icon' => 'anatomy',
            'icon_bg' => '#EDE9FE',
            'outline_url' => '#',
        ]);

        $lessons = [
            ['Introduction to Anatomy & Physiology', 'Learn foundational concepts in anatomy and physiology, including terminology, body planes, regions, and homeostasis.', 890],
            ['Levels of Organization', 'Understand how atoms, molecules, cells, tissues, organs, and systems combine to form the human body.', 1110],
            ['Chemical Basis of Life', 'Review essential chemistry concepts including acids, bases, and biochemical processes in human cells.', 960],
            ['Cells & Tissues', 'Examine cell structure, membrane transport, and the four primary tissue types and their functions.', 1050],
            ['The Integumentary System', 'Study skin layers, appendages, and the protective role of the integumentary system.', 930],
            ['The Skeletal System', 'Identify major bones, joints, and the structural support provided by the skeleton.', 1080],
            ['The Muscular System', 'Explore muscle types, contraction mechanisms, and major muscle groups.', 1020],
            ['The Nervous System', 'Understand neurons, central and peripheral nervous system organisation, and reflex pathways.', 1140],
            ['The Endocrine System', 'Review hormones, target tissues, and feedback mechanisms that regulate body functions.', 990],
            ['The Cardiovascular System', 'Learn heart anatomy, blood flow, and the role of vessels in circulation.', 1120],
            ['Lymphatic & Immune Systems', 'Examine lymphatic drainage, immune responses, and defence against infection.', 870],
            ['The Respiratory System', 'Study pulmonary anatomy, gas exchange, and ventilation mechanics.', 960],
            ['The Digestive System', 'Follow the pathway of digestion from ingestion to nutrient absorption.', 1050],
            ['The Urinary System', 'Understand kidney structure, filtration, and fluid balance regulation.', 900],
            ['The Reproductive System', 'Review male and female reproductive anatomy and related physiological processes.', 930],
            ['Clinical Integration & Review', 'Integrate anatomy and physiology concepts through case studies and NCLEX-style review.', 1200],
        ];

        $this->syncLessons($course, $lessons);
    }

    private function seedObstetrics(): void
    {
        $course = Course::query()->where('slug', 'obstetrics-nursing')->first();
        if (! $course) {
            return;
        }

        $course->update([
            'title' => 'Obstetrics Nursing',
            'description' => 'Provide compassionate, evidence-based care for mothers and newborns throughout pregnancy, labour, delivery, and recovery.',
            'icon' => 'obstetrics',
            'icon_bg' => '#FFE8F0',
            'outline_url' => '#',
        ]);

        $lessons = [
            ['Introduction to Obstetrics Nursing', 'Explore the scope of obstetric nursing, maternal health priorities, and the nurse\'s role across the childbearing continuum.', 890],
            ['Reproductive Anatomy & Physiology', 'Review female reproductive structures, hormonal cycles, and physiological changes during pregnancy.', 1110],
            ['Antenatal Assessment & Care', 'Perform prenatal assessments, monitor fetal wellbeing, and educate expectant mothers on healthy pregnancy practices.', 1050],
            ['Nutrition & Health in Pregnancy', 'Support optimal maternal nutrition, weight management, and lifestyle choices during antenatal care.', 960],
            ['Common Discomforts of Pregnancy', 'Identify normal versus concerning symptoms and implement nursing interventions for common pregnancy complaints.', 930],
            ['High-Risk Pregnancy', 'Recognize risk factors, complications, and collaborative care plans for high-risk antenatal patients.', 1080],
            ['Labour & Delivery Process', 'Understand the stages of labour, maternal progress, and nursing support during childbirth.', 1140],
            ['Fetal Monitoring & Assessment', 'Interpret fetal heart rate patterns and respond to signs of fetal compromise during labour.', 1020],
            ['Pain Management in Labour', 'Apply pharmacologic and non-pharmacologic comfort measures during labour and delivery.', 990],
            ['Obstetric Emergencies', 'Respond to hemorrhage, eclampsia, prolapsed cord, and other urgent obstetric situations.', 1050],
            ['Cesarean Birth & Recovery', 'Prepare patients for cesarean delivery and provide postoperative monitoring and education.', 960],
            ['Postpartum Assessment', 'Conduct systematic postpartum assessments for maternal recovery and early complication detection.', 900],
            ['Newborn Assessment & Care', 'Perform initial newborn assessments, thermoregulation, feeding support, and bonding promotion.', 1020],
            ['Breastfeeding Support', 'Guide lactation initiation, troubleshoot common feeding challenges, and support infant nutrition.', 870],
            ['Postpartum Mood & Mental Health', 'Screen for postpartum depression and anxiety and connect families with appropriate support.', 930],
            ['Clinical Integration & Review', 'Integrate obstetric nursing concepts through case studies and NCLEX-style review questions.', 1200],
        ];

        $this->syncLessons($course, $lessons);
    }

    /** @param array<int, array{0: string, 1: string, 2: int}> $lessons */
    private function syncLessons(Course $course, array $lessons): void
    {
        Lesson::query()->where('course_id', $course->id)->delete();

        foreach ($lessons as $index => [$title, $description, $durationSeconds]) {
            Lesson::query()->create([
                'course_id' => $course->id,
                'title' => $title,
                'description' => $description,
                'duration_seconds' => $durationSeconds,
                'sort_order' => $index + 1,
            ]);
        }
    }
}
