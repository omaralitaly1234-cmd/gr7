'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function ExerciseLibraryPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [expandedExercise, setExpandedExercise] = useState(null);

  const muscleGroups = [
    { id: 'all', name: locale === 'ar' ? 'الكل' : 'All', icon: '💪', count: 24 },
    { id: 'chest', name: locale === 'ar' ? 'الصدر' : 'Chest', icon: '🫁', count: 5 },
    { id: 'back', name: locale === 'ar' ? 'الظهر' : 'Back', icon: '🔙', count: 5 },
    { id: 'shoulders', name: locale === 'ar' ? 'الأكتاف' : 'Shoulders', icon: '🏋️', count: 4 },
    { id: 'arms', name: locale === 'ar' ? 'الذراعين' : 'Arms', icon: '💪', count: 4 },
    { id: 'legs', name: locale === 'ar' ? 'الأرجل' : 'Legs', icon: '🦵', count: 4 },
    { id: 'core', name: locale === 'ar' ? 'البطن' : 'Core', icon: '🎯', count: 2 },
  ];

  const exercises = [
    // Chest
    { id: 1, muscle: 'chest', name: locale === 'ar' ? 'بنش بريس (بار)' : 'Barbell Bench Press', nameEn: 'Bench Press', difficulty: 3, equipment: locale === 'ar' ? 'بار + بنش' : 'Barbell + Bench', sets: '4×10', tips: locale === 'ar' ? 'حافظ على كتفيك ثابتة على البنش. لا ترفع ظهرك.' : 'Keep shoulders pinned. Don\'t arch back.', muscles: locale === 'ar' ? 'الصدر الأوسط، تراي' : 'Mid Chest, Triceps' },
    { id: 2, muscle: 'chest', name: locale === 'ar' ? 'دمبل فلاي' : 'Dumbbell Fly', nameEn: 'DB Fly', difficulty: 2, equipment: locale === 'ar' ? 'دمبلز + بنش' : 'Dumbbells + Bench', sets: '3×12', tips: locale === 'ar' ? 'اقفل دراعك approximately 15 درجة. حركة بطيئة.' : 'Keep slight bend in elbow. Slow motion.', muscles: locale === 'ar' ? 'الصدر الداخلي' : 'Inner Chest' },
    { id: 3, muscle: 'chest', name: locale === 'ar' ? 'بنش بريس مائل (هاي)' : 'Incline Bench Press', nameEn: 'Incline Press', difficulty: 3, equipment: locale === 'ar' ? 'بار + بنش مائل' : 'Barbell + Incline', sets: '4×10', tips: locale === 'ar' ? 'زاوية 30-45 درجة. تنفس صحيح.' : 'Angle 30-45°. Proper breathing.', muscles: locale === 'ar' ? 'الصدر العلوي' : 'Upper Chest' },
    { id: 4, muscle: 'chest', name: locale === 'ar' ? 'كروس أوفر (كابلز)' : 'Cable Crossover', nameEn: 'Cable Cross', difficulty: 2, equipment: locale === 'ar' ? 'جهاز كابلز' : 'Cable Machine', sets: '3×15', tips: locale === 'ar' ? 'اضغط في آخر الحركة. حافظ على الزاوية.' : 'Squeeze at bottom. Keep angle.', muscles: locale === 'ar' ? 'الصدر الداخلي السفلي' : 'Lower Inner Chest' },
    { id: 5, muscle: 'chest', name: locale === 'ar' ? 'ضغط بنش (ديكلاين)' : 'Decline Bench Press', nameEn: 'Decline Press', difficulty: 3, equipment: locale === 'ar' ? 'بار + بنش ديكلاين' : 'Barbell + Decline', sets: '3×10', tips: locale === 'ar' ? 'زاوية سالبة 15-30 درجة.' : 'Angle -15 to -30°.', muscles: locale === 'ar' ? 'الصدر السفلي' : 'Lower Chest' },
    // Back
    { id: 6, muscle: 'back', name: locale === 'ar' ? 'ديد ليفت' : 'Deadlift', nameEn: 'Deadlift', difficulty: 5, equipment: locale === 'ar' ? 'بار' : 'Barbell', sets: '4×8', tips: locale === 'ar' ? 'حافظ على ظهرك مستقيم! لا تقوس أبداً.' : 'Keep back straight! Never round.', muscles: locale === 'ar' ? 'الظهر السفلي، عضلات خلفية' : 'Lower Back, Hamstrings' },
    { id: 7, muscle: 'back', name: locale === 'ar' ? 'سحب أمامي (لات)' : 'Lat Pulldown', nameEn: 'Lat Pulldown', difficulty: 2, equipment: locale === 'ar' ? 'جهاز اللات' : 'Lat Machine', sets: '4×12', tips: locale === 'ar' ? 'اسحب للصدر مش الرقبة. انزل كتفك.' : 'Pull to chest not neck. Depress shoulders.', muscles: locale === 'ar' ? 'اللاتس، بايسبس' : 'Lats, Biceps' },
    { id: 8, muscle: 'back', name: locale === 'ar' ? 'تجديف بالبار' : 'Barbell Row', nameEn: 'Barbell Row', difficulty: 4, equipment: locale === 'ar' ? 'بار' : 'Barbell', sets: '4×10', tips: locale === 'ar' ? 'زاوية 45 درجة. اسحب للبطن.' : '45° angle. Pull to belly button.', muscles: locale === 'ar' ? 'الظهر الأوسط، اللاتس' : 'Mid Back, Lats' },
    { id: 9, muscle: 'back', name: locale === 'ar' ? 'سحب أرضي (كابل)' : 'Seated Cable Row', nameEn: 'Cable Row', difficulty: 2, equipment: locale === 'ar' ? 'جهاز كابل' : 'Cable Machine', sets: '3×12', tips: locale === 'ar' ? 'لا تميل للأمام كتير. اسحب الأكواع للخلف.' : 'Don\'t lean too far forward. Pull elbows back.', muscles: locale === 'ar' ? 'الظهر الأوسط' : 'Mid Back' },
    { id: 10, muscle: 'back', name: locale === 'ar' ? 'عقلة (بُل أب)' : 'Pull-Up', nameEn: 'Pull-Up', difficulty: 4, equipment: locale === 'ar' ? 'عقلة' : 'Pull-Up Bar', sets: '4×max', tips: locale === 'ar' ? 'قبضة واسعة = لاتس. قبضة ضيقة = بايسبس.' : 'Wide grip = lats. Close grip = biceps.', muscles: locale === 'ar' ? 'اللاتس، بايسبس' : 'Lats, Biceps' },
    // Shoulders
    { id: 11, muscle: 'shoulders', name: locale === 'ar' ? 'ضغط علوي (بار)' : 'Overhead Press', nameEn: 'OHP', difficulty: 4, equipment: locale === 'ar' ? 'بار' : 'Barbell', sets: '4×10', tips: locale === 'ar' ? 'قف ثابت. لا تقوس ظهرك.' : 'Stand firm. Don\'t arch back.', muscles: locale === 'ar' ? 'الكتف الأمامي' : 'Front Delt' },
    { id: 12, muscle: 'shoulders', name: locale === 'ar' ? 'رفع جانبي (لاتيرال رايز)' : 'Lateral Raise', nameEn: 'Lat Raise', difficulty: 2, equipment: locale === 'ar' ? 'دمبلز' : 'Dumbbells', sets: '3×15', tips: locale === 'ar' ? 'لا ترفع أعلى من الكتف. حركة بطيئة.' : 'Don\'t go above shoulder. Slow motion.', muscles: locale === 'ar' ? 'الكتف الجانبي' : 'Side Delt' },
    { id: 13, muscle: 'shoulders', name: locale === 'ar' ? 'واجة دمبل أمامي' : 'Front Raise', nameEn: 'Front Raise', difficulty: 1, equipment: locale === 'ar' ? 'دمبلز' : 'Dumbbells', sets: '3×12', tips: locale === 'ar' ? 'تناوب يمين وشمال.' : 'Alternate sides.', muscles: locale === 'ar' ? 'الكتف الأمامي' : 'Front Delt' },
    { id: 14, muscle: 'shoulders', name: locale === 'ar' ? 'ريفرس فلاي (ظهر الكتف)' : 'Reverse Fly', nameEn: 'Rev Fly', difficulty: 2, equipment: locale === 'ar' ? 'دمبلز / كابل' : 'DBs / Cable', sets: '3×15', tips: locale === 'ar' ? 'مهم جداً لتوازن الكتف.' : 'Critical for shoulder balance.', muscles: locale === 'ar' ? 'الكتف الخلفي' : 'Rear Delt' },
    // Arms
    { id: 15, muscle: 'arms', name: locale === 'ar' ? 'بايسبس كيرل (بار)' : 'Barbell Curl', nameEn: 'BB Curl', difficulty: 2, equipment: locale === 'ar' ? 'بار EZ' : 'EZ Bar', sets: '3×12', tips: locale === 'ar' ? 'ثبت الكوع. لا تهز جسمك.' : 'Pin elbow. Don\'t swing.', muscles: locale === 'ar' ? 'البايسبس' : 'Biceps' },
    { id: 16, muscle: 'arms', name: locale === 'ar' ? 'تراي بوش داون (كابل)' : 'Tricep Pushdown', nameEn: 'Pushdown', difficulty: 1, equipment: locale === 'ar' ? 'كابل' : 'Cable', sets: '3×15', tips: locale === 'ar' ? 'ثبت الكوع بجانب جسمك. اضغط لتحت.' : 'Keep elbows at sides.', muscles: locale === 'ar' ? 'التراي' : 'Triceps' },
    { id: 17, muscle: 'arms', name: locale === 'ar' ? 'هامر كيرل (دمبل)' : 'Hammer Curl', nameEn: 'Hammer Curl', difficulty: 2, equipment: locale === 'ar' ? 'دمبلز' : 'Dumbbells', sets: '3×12', tips: locale === 'ar' ? 'قبضة عمودية. يستهدف براكياليس.' : 'Neutral grip. Targets brachialis.', muscles: locale === 'ar' ? 'بايسبس + ذراع' : 'Biceps + Forearm' },
    { id: 18, muscle: 'arms', name: locale === 'ar' ? 'تراي فريسب إكستنشن' : 'Skull Crusher', nameEn: 'Skull Crusher', difficulty: 3, equipment: locale === 'ar' ? 'بار EZ + بنش' : 'EZ Bar + Bench', sets: '3×10', tips: locale === 'ar' ? 'انزل لراسك ببطء. ثبت الكوع.' : 'Lower slowly to skull. Pin elbows.', muscles: locale === 'ar' ? 'التراي' : 'Triceps' },
    // Legs
    { id: 19, muscle: 'legs', name: locale === 'ar' ? 'سكوات' : 'Squat', nameEn: 'Squat', difficulty: 5, equipment: locale === 'ar' ? 'بار + رف' : 'Barbell + Rack', sets: '4×10', tips: locale === 'ar' ? 'ركبتك لا تتعدى صوابعك. عمق كافي.' : 'Knees don\'t pass toes. Depth matters.', muscles: locale === 'ar' ? 'كواد، عضلات خلفية، أرداف' : 'Quads, Hams, Glutes' },
    { id: 20, muscle: 'legs', name: locale === 'ar' ? 'ليج بريس' : 'Leg Press', nameEn: 'Leg Press', difficulty: 2, equipment: locale === 'ar' ? 'جهاز ليج بريس' : 'Leg Press Machine', sets: '4×12', tips: locale === 'ar' ? 'لا تقفل ركبتك بالكامل في الأعلى.' : 'Don\'t lock knees at top.', muscles: locale === 'ar' ? 'الكواد، الأرداف' : 'Quads, Glutes' },
    { id: 21, muscle: 'legs', name: locale === 'ar' ? 'رومانيان ديد ليفت' : 'Romanian Deadlift', nameEn: 'RDL', difficulty: 4, equipment: locale === 'ar' ? 'بار / دمبلز' : 'Barbell / DBs', sets: '4×10', tips: locale === 'ar' ? 'ثني خفيف في الركبة. ظهر مستقيم.' : 'Slight knee bend. Straight back.', muscles: locale === 'ar' ? 'عضلات خلفية، أرداف' : 'Hamstrings, Glutes' },
    { id: 22, muscle: 'legs', name: locale === 'ar' ? 'ليج كيرل' : 'Leg Curl', nameEn: 'Leg Curl', difficulty: 1, equipment: locale === 'ar' ? 'جهاز ليج كيرل' : 'Leg Curl Machine', sets: '3×15', tips: locale === 'ar' ? 'تحكم في الحركة. لا تستخدم زخم.' : 'Control the movement.', muscles: locale === 'ar' ? 'عضلات خلفية' : 'Hamstrings' },
    // Core
    { id: 23, muscle: 'core', name: locale === 'ar' ? 'بلانك' : 'Plank', nameEn: 'Plank', difficulty: 2, equipment: locale === 'ar' ? 'بدون' : 'None', sets: '3×60s', tips: locale === 'ar' ? 'جسم مستقيم. لا تنزل وسطك.' : 'Body straight. Don\'t sag.', muscles: locale === 'ar' ? 'البطن، كور' : 'Core, Abs' },
    { id: 24, muscle: 'core', name: locale === 'ar' ? 'كرنشز (كابل)' : 'Cable Crunch', nameEn: 'Cable Crunch', difficulty: 2, equipment: locale === 'ar' ? 'كابل' : 'Cable', sets: '3×20', tips: locale === 'ar' ? 'اضغط بالبطن مش الذراعين.' : 'Crunch with abs not arms.', muscles: locale === 'ar' ? 'البطن العلوي' : 'Upper Abs' },
  ];

  const filteredExercises = selectedMuscle === 'all' ? exercises : exercises.filter(e => e.muscle === selectedMuscle);

  const difficultyStars = (level) => '⭐'.repeat(level) + '☆'.repeat(5 - level);

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>📚</span> {locale === 'ar' ? 'مكتبة التمارين' : 'Exercise Library'}</h1>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)' }}>
          💪 {filteredExercises.length} {locale === 'ar' ? 'تمرين' : 'exercises'}
        </span>
      </div>

      {/* Muscle Group Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {muscleGroups.map(mg => (
          <button
            key={mg.id}
            onClick={() => setSelectedMuscle(mg.id)}
            className={`btn ${selectedMuscle === mg.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {mg.icon} {mg.name} <span style={{ fontSize: '10px', opacity: 0.7 }}>({mg.count})</span>
          </button>
        ))}
      </div>

      {/* Exercise List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filteredExercises.map(ex => {
          const isExpanded = expandedExercise === ex.id;
          return (
            <div key={ex.id} className="card" style={{ cursor: 'pointer', borderInlineStart: `3px solid ${ex.difficulty >= 4 ? 'var(--pt-danger)' : ex.difficulty >= 3 ? 'var(--pt-warning)' : 'var(--pt-success)'}` }}
              onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>{ex.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>
                    {ex.muscles} • {ex.equipment} • {ex.sets}
                  </div>
                </div>
                <div style={{ textAlign: 'end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '-1px' }}>{difficultyStars(ex.difficulty)}</span>
                  <span style={{ fontSize: '16px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                </div>
              </div>
              {isExpanded && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--glass-border)' }}>
                  <div className="grid grid-3" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginBottom: '2px' }}>🎯 {locale === 'ar' ? 'العضلات' : 'Muscles'}</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{ex.muscles}</div>
                    </div>
                    <div style={{ padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginBottom: '2px' }}>🏋️ {locale === 'ar' ? 'الأدوات' : 'Equipment'}</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{ex.equipment}</div>
                    </div>
                    <div style={{ padding: 'var(--space-2)', background: 'var(--pt-darker)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)', marginBottom: '2px' }}>📋 {locale === 'ar' ? 'المجموعات' : 'Sets'}</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{ex.sets}</div>
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-3)', background: 'rgba(245,197,24,0.05)', borderRadius: 'var(--radius-sm)', borderInlineStart: '3px solid var(--pt-gold)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--pt-gold)', fontWeight: 700, marginBottom: '4px' }}>💡 {locale === 'ar' ? 'نصائح' : 'Tips'}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-300)' }}>{ex.tips}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
