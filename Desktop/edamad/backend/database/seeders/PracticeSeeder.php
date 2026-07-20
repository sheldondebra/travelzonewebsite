<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\PracticeTest;
use App\Models\Question;
use Illuminate\Database\Seeder;

class PracticeSeeder extends Seeder
{
    public function run(): void
    {
        $pharmacology = Course::query()->where('slug', 'pharmacology')->first();
        if (! $pharmacology) {
            return;
        }

        $tests = [
            [
                'title' => 'Test 1: Basic Pharmacology',
                'slug' => 'basic-pharmacology',
                'description' => 'Foundational pharmacology concepts and safe practice.',
                'icon' => 'clipboard',
                'duration_minutes' => 60,
            ],
            [
                'title' => 'Test 2: Cardiovascular Drugs',
                'slug' => 'cardiovascular-drugs',
                'description' => 'Medications affecting the cardiovascular system.',
                'icon' => 'stethoscope',
                'duration_minutes' => 60,
            ],
            [
                'title' => 'Test 3: Antimicrobial Therapy',
                'slug' => 'antimicrobial-therapy',
                'description' => 'Antibiotics, resistance, and nursing monitoring.',
                'icon' => 'shield',
                'duration_minutes' => 60,
            ],
            [
                'title' => 'Test 4: Pain Management',
                'slug' => 'pain-management',
                'description' => 'Analgesics, adjuvants, and patient safety.',
                'icon' => 'activity',
                'duration_minutes' => 60,
            ],
        ];

        $questionBank = $this->pharmacologyQuestions();

        foreach ($tests as $index => $testData) {
            $test = PracticeTest::query()->updateOrCreate(
                ['slug' => $testData['slug']],
                [
                    ...$testData,
                    'course_id' => $pharmacology->id,
                    'is_published' => true,
                    'passing_score' => 70,
                ],
            );

            $test->questions()->detach();

            $chunk = array_slice($questionBank, $index * 3, 12);
            if (count($chunk) < 12) {
                $chunk = array_merge($chunk, array_slice($questionBank, 0, 12 - count($chunk)));
            }

            foreach ($chunk as $order => $qData) {
                $question = Question::query()->updateOrCreate(
                    [
                        'course_id' => $pharmacology->id,
                        'question_text' => $qData['question_text'],
                    ],
                    $qData,
                );

                $test->questions()->attach($question->id, ['sort_order' => $order + 1]);
            }

            $test->update(['question_count' => $test->questions()->count()]);
        }

        $this->seedCourseTests('paediatric-nursing', 'Paediatric Nursing', [
            ['title' => 'Paediatric Nursing Test Questions', 'slug' => 'paediatric-nursing-test', 'icon' => 'baby'],
        ]);

        $this->seedCourseTests('adult-medical-surgical-nursing', 'Medical-Surgical', [
            ['title' => 'Practice Test: Fluid and Electrolyte Imbalance', 'slug' => 'fluid-electrolyte', 'icon' => 'stethoscope'],
            ['title' => 'Test Review: Cardiovascular Disorders', 'slug' => 'cardiovascular-disorders', 'icon' => 'heart'],
        ]);

        $this->seedCourseTests('obstetrics-nursing', 'Obstetric Nursing', [
            ['title' => 'Practice Test: Antepartum Care', 'slug' => 'antepartum-care', 'icon' => 'heart'],
        ]);

        $this->seedCourseTests('advanced-nursing', 'Advanced Nursing Practice', [
            ['title' => 'Practice Test: Advanced Clinical Reasoning', 'slug' => 'advanced-clinical-reasoning', 'icon' => 'cap'],
        ]);

        $this->seedCourseTests('public-health-nursing', 'Public Health Nursing', [
            ['title' => 'Practice Test: Community Health Promotion', 'slug' => 'community-health', 'icon' => 'globe'],
        ]);
    }

    private function seedCourseTests(string $courseSlug, string $topicPrefix, array $tests): void
    {
        $course = Course::query()->where('slug', $courseSlug)->first();
        if (! $course) {
            return;
        }

        foreach ($tests as $testData) {
            $test = PracticeTest::query()->updateOrCreate(
                ['slug' => $testData['slug']],
                [
                    'title' => $testData['title'],
                    'description' => "Practice questions for {$course->title}.",
                    'icon' => $testData['icon'],
                    'course_id' => $course->id,
                    'duration_minutes' => 60,
                    'passing_score' => 70,
                    'is_published' => true,
                ],
            );

            if ($test->questions()->count() > 0) {
                continue;
            }

            for ($i = 1; $i <= 12; $i++) {
                $question = Question::query()->create([
                    'course_id' => $course->id,
                    'question_text' => "Sample {$topicPrefix} question {$i}: Which nursing action is the priority for this clinical scenario?",
                    'options' => [
                        'A' => 'Assess airway, breathing, and circulation first.',
                        'B' => 'Administer prescribed medications immediately.',
                        'C' => 'Document findings and notify the physician later.',
                        'D' => 'Provide patient education about the condition.',
                    ],
                    'correct_answer' => 'A',
                    'explanation' => 'The nursing process prioritizes assessment and stabilization of life-threatening conditions before other interventions.',
                    'reference' => 'Reference: Lewis, S. L., et al. Medical-Surgical Nursing (12th ed.). Elsevier.',
                    'topic' => "{$topicPrefix} Fundamentals",
                    'difficulty' => 'medium',
                ]);

                $test->questions()->attach($question->id, ['sort_order' => $i]);
            }

            $test->update(['question_count' => 12]);
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function pharmacologyQuestions(): array
    {
        return [
            [
                'question_text' => 'A patient with hypertension is prescribed a drug that inhibits angiotensin-converting enzyme (ACE). What is the primary mechanism of action of this drug?',
                'options' => [
                    'A' => 'By blocking angiotensin II receptors',
                    'B' => 'By inhibiting the conversion of angiotensin I to angiotensin II',
                    'C' => 'By stimulating beta-adrenergic receptors',
                    'D' => 'By blocking calcium channels in vascular smooth muscle',
                ],
                'correct_answer' => 'B',
                'explanation' => 'ACE inhibitors prevent the conversion of angiotensin I to angiotensin II, reducing vasoconstriction and aldosterone secretion, which lowers blood pressure.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Cardiovascular Pharmacology',
            ],
            [
                'question_text' => 'Which laboratory value should the nurse monitor most closely in a patient receiving furosemide?',
                'options' => [
                    'A' => 'Serum potassium',
                    'B' => 'Serum calcium',
                    'C' => 'Hemoglobin',
                    'D' => 'Platelet count',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Loop diuretics such as furosemide promote potassium loss, increasing the risk of hypokalemia.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Diuretics',
            ],
            [
                'question_text' => 'A nurse is preparing to administer digoxin. Which finding requires withholding the medication and notifying the provider?',
                'options' => [
                    'A' => 'Heart rate of 58 beats per minute',
                    'B' => 'Blood pressure of 128/78 mmHg',
                    'C' => 'Respiratory rate of 18 breaths per minute',
                    'D' => 'Temperature of 37.1°C',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Digoxin is typically held when the apical heart rate is below 60 bpm in adults due to risk of bradycardia and toxicity.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Cardiovascular Pharmacology',
            ],
            [
                'question_text' => 'Which instruction is most important for a patient starting warfarin therapy?',
                'options' => [
                    'A' => 'Maintain consistent intake of vitamin K-rich foods',
                    'B' => 'Take the medication only when blood pressure is elevated',
                    'C' => 'Double the dose if a dose is missed',
                    'D' => 'Avoid all follow-up laboratory tests',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Warfarin effect is antagonized by vitamin K; consistent dietary intake helps maintain stable INR levels.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Anticoagulants',
            ],
            [
                'question_text' => 'A patient develops a rash and difficulty breathing after receiving penicillin. What is the nurse\'s immediate priority?',
                'options' => [
                    'A' => 'Stop the infusion and assess airway and breathing',
                    'B' => 'Administer the next scheduled dose as ordered',
                    'C' => 'Document the reaction at the end of the shift',
                    'D' => 'Encourage increased oral fluid intake only',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Signs of anaphylaxis require immediate discontinuation of the medication and emergency airway assessment.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Antimicrobial Therapy',
            ],
            [
                'question_text' => 'Which opioid side effect should the nurse monitor for in a postoperative patient receiving morphine?',
                'options' => [
                    'A' => 'Respiratory depression',
                    'B' => 'Hypertension',
                    'C' => 'Hyperglycemia',
                    'D' => 'Bradycardia only without respiratory changes',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Opioids depress the respiratory center in the brainstem, making respiratory rate and depth critical assessment parameters.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Pain Management',
            ],
            [
                'question_text' => 'Metformin is contraindicated in which condition?',
                'options' => [
                    'A' => 'Severe renal impairment',
                    'B' => 'Mild hypertension',
                    'C' => 'Type 1 diabetes mellitus as monotherapy in all cases',
                    'D' => 'Hyperlipidemia',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Metformin accumulation in renal failure increases the risk of lactic acidosis.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Endocrine Medications',
            ],
            [
                'question_text' => 'Which teaching point is essential for a patient prescribed nitroglycerin sublingual tablets?',
                'options' => [
                    'A' => 'Store tablets in a dark, tightly closed container and replace every 3–6 months',
                    'B' => 'Swallow the tablet with a full glass of water',
                    'C' => 'Take the tablet daily at bedtime regardless of symptoms',
                    'D' => 'Avoid sitting down after administration',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Nitroglycerin is light-sensitive and loses potency when exposed to air; patients should sit when taking it to reduce orthostatic hypotension.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Cardiovascular Pharmacology',
            ],
            [
                'question_text' => 'A patient taking phenytoin should be monitored for which adverse effect?',
                'options' => [
                    'A' => 'Gingival hyperplasia',
                    'B' => 'Weight loss only',
                    'C' => 'Hyperkalemia',
                    'D' => 'Dry nonproductive cough',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Phenytoin commonly causes gingival overgrowth, requiring dental hygiene teaching.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Neurologic Medications',
            ],
            [
                'question_text' => 'Which action best reduces the risk of aminoglycoside nephrotoxicity?',
                'options' => [
                    'A' => 'Monitor renal function and maintain therapeutic drug levels',
                    'B' => 'Administer with high-fat meals',
                    'C' => 'Double the dose to achieve rapid effect',
                    'D' => 'Withhold all oral fluids',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Aminoglycosides are concentration-dependent nephrotoxins; monitoring levels and renal function is essential.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Antimicrobial Therapy',
            ],
            [
                'question_text' => 'Salicylate toxicity is characterized by which early symptom?',
                'options' => [
                    'A' => 'Tinnitus',
                    'B' => 'Polyuria without other symptoms',
                    'C' => 'Hypertension',
                    'D' => 'Bradycardia',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Tinnitus and hearing changes are classic early signs of salicylate toxicity.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Pain Management',
            ],
            [
                'question_text' => 'Insulin glargine differs from regular insulin because it is:',
                'options' => [
                    'A' => 'A long-acting basal insulin',
                    'B' => 'Only used intravenously',
                    'C' => 'Rapid-acting and given before meals only',
                    'D' => 'Safe to mix with all insulin types without caution',
                ],
                'correct_answer' => 'A',
                'explanation' => 'Glargine provides a relatively peakless basal insulin effect over approximately 24 hours.',
                'reference' => 'Reference: Katzung, B. G., & Trevor, A. J. (2021). Basic & Clinical Pharmacology (15th ed.). McGraw Hill.',
                'topic' => 'Endocrine Medications',
            ],
        ];
    }
}
