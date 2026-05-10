'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { getTenantDocument, updateTenantDocument } from '@/lib/firebase/firestore';
import { useTenant } from '@/context/TenantContext';
import toast from 'react-hot-toast';

export default function EditMemberPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale || 'ar';
  const memberId = params?.id;
  const isAr = locale === 'ar';
  const { tenantId } = useTenant();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullNameAr: '', fullNameEn: '',
    phone: '', whatsapp: '', email: '',
    gender: 'male', dateOfBirth: '',
    nationalId: '', address: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    height: '', weight: '', bloodType: '',
    medicalNotes: '', fitnessGoal: 'fitness',
    notes: '',
  });

  useEffect(() => {
    async function loadMember() {
      if (!tenantId || !memberId) { setLoading(false); return; }
      try {
        const { data } = await getTenantDocument(tenantId, 'members', memberId);
        if (data) {
          setFormData({
            fullNameAr: data.fullName?.ar || '',
            fullNameEn: data.fullName?.en || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || '',
            email: data.email || '',
            gender: data.gender || 'male',
            dateOfBirth: data.dateOfBirth || '',
            nationalId: data.nationalId || '',
            address: data.address || '',
            emergencyName: data.emergencyContact?.name || '',
            emergencyPhone: data.emergencyContact?.phone || '',
            emergencyRelation: data.emergencyContact?.relation || '',
            height: data.height || '',
            weight: data.weight || '',
            bloodType: data.bloodType || '',
            medicalNotes: data.medicalNotes || '',
            fitnessGoal: data.fitnessGoal || 'fitness',
            notes: data.notes || '',
          });
        }
      } catch (err) {
        console.error('Failed to load member:', err);
        toast.error(isAr ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading member data');
      }
      setLoading(false);
    }
    loadMember();
  }, [tenantId, memberId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantId || !memberId) return;
    if (!formData.fullNameAr || !formData.phone) {
      toast.error(isAr ? 'الاسم بالعربية والهاتف مطلوبان' : 'Arabic name and phone are required');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        fullName: { ar: formData.fullNameAr, en: formData.fullNameEn || formData.fullNameAr },
        phone: formData.phone,
        whatsapp: formData.whatsapp || formData.phone,
        email: formData.email,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || null,
        nationalId: formData.nationalId,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relation: formData.emergencyRelation,
        },
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        bloodType: formData.bloodType,
        medicalNotes: formData.medicalNotes,
        fitnessGoal: formData.fitnessGoal,
        notes: formData.notes,
      };

      const { error } = await updateTenantDocument(tenantId, 'members', memberId, updateData);
      if (error) throw new Error(error);

      toast.success(isAr ? 'تم تحديث بيانات العضو بنجاح ✅' : 'Member updated successfully ✅');
      router.push(`/${locale}/admin/members/${memberId}`);
    } catch (err) {
      console.error('Error updating member:', err);
      toast.error(isAr ? 'حدث خطأ أثناء تحديث البيانات' : 'Error updating member');
    }
    setSaving(false);
  };

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⚡</div>
        <p style={{ color: 'var(--pt-gray-500)', marginTop: '0.5rem' }}>{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h1><span>✏️</span> {isAr ? 'تعديل بيانات العضو' : 'Edit Member'}</h1>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          ← {t('common.back')}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="card" style={{ maxWidth: 800, margin: '0 auto', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-lg)' }}>
            👤 {t('members.personalInfo')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('members.fullNameAr')} *</label>
              <input className="form-input" type="text" value={formData.fullNameAr}
                onChange={e => handleChange('fullNameAr', e.target.value)}
                placeholder={isAr ? 'أحمد محمد سعيد' : 'أحمد محمد سعيد'} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.fullNameEn')}</label>
              <input className="form-input" type="text" dir="ltr" value={formData.fullNameEn}
                onChange={e => handleChange('fullNameEn', e.target.value)}
                placeholder="Ahmed Mohamed Said" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.phone')} *</label>
              <input className="form-input" type="tel" dir="ltr" value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="01234567890" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.whatsapp')}</label>
              <input className="form-input" type="tel" dir="ltr" value={formData.whatsapp}
                onChange={e => handleChange('whatsapp', e.target.value)}
                placeholder="01234567890" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.email')}</label>
              <input className="form-input" type="email" dir="ltr" value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="ahmed@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.gender')} *</label>
              <select className="form-select" value={formData.gender}
                onChange={e => handleChange('gender', e.target.value)}>
                <option value="male">{t('common.male')}</option>
                <option value="female">{t('common.female')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.dateOfBirth')}</label>
              <input className="form-input" type="date" dir="ltr" value={formData.dateOfBirth}
                onChange={e => handleChange('dateOfBirth', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.nationalId')}</label>
              <input className="form-input" type="text" dir="ltr" value={formData.nationalId}
                onChange={e => handleChange('nationalId', e.target.value)}
                placeholder="29901011234567" maxLength={14} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">{t('members.address')}</label>
              <input className="form-input" type="text" value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder={isAr ? 'المنصورة' : 'Mansoura'} />
            </div>
          </div>

          {/* Emergency Contact */}
          <h4 style={{ margin: 'var(--space-6) 0 var(--space-4)', color: 'var(--pt-gray-300)' }}>
            🆘 {t('members.emergencyContact')}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('members.emergencyName')}</label>
              <input className="form-input" type="text" value={formData.emergencyName}
                onChange={e => handleChange('emergencyName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.emergencyPhone')}</label>
              <input className="form-input" type="tel" dir="ltr" value={formData.emergencyPhone}
                onChange={e => handleChange('emergencyPhone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.emergencyRelation')}</label>
              <input className="form-input" type="text" value={formData.emergencyRelation}
                onChange={e => handleChange('emergencyRelation', e.target.value)}
                placeholder={isAr ? 'أب / أخ / صديق' : 'Father / Brother / Friend'} />
            </div>
          </div>
        </div>

        {/* Health Info */}
        <div className="card" style={{ maxWidth: 800, margin: '0 auto', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--font-size-lg)' }}>
            🏥 {t('members.healthInfo')}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">{t('members.height')}</label>
              <input className="form-input" type="number" dir="ltr" value={formData.height}
                onChange={e => handleChange('height', e.target.value)} placeholder="175" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.weight')}</label>
              <input className="form-input" type="number" dir="ltr" value={formData.weight}
                onChange={e => handleChange('weight', e.target.value)} placeholder="80" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.bloodType')}</label>
              <select className="form-select" value={formData.bloodType}
                onChange={e => handleChange('bloodType', e.target.value)}>
                <option value="">{t('common.select')}</option>
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('members.fitnessGoal')}</label>
              <select className="form-select" value={formData.fitnessGoal}
                onChange={e => handleChange('fitnessGoal', e.target.value)}>
                <option value="muscle_gain">{t('members.goals.muscle_gain')}</option>
                <option value="weight_loss">{t('members.goals.weight_loss')}</option>
                <option value="fitness">{t('members.goals.fitness')}</option>
                <option value="rehabilitation">{t('members.goals.rehabilitation')}</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-2)' }}>
            <label className="form-label">{t('members.medicalNotes')}</label>
            <textarea className="form-input" value={formData.medicalNotes} rows={3}
              onChange={e => handleChange('medicalNotes', e.target.value)}
              placeholder={isAr ? 'أي ملاحظات طبية أو إصابات سابقة...' : 'Any medical notes or previous injuries...'} />
          </div>
        </div>

        {/* Notes */}
        <div className="card" style={{ maxWidth: 800, margin: '0 auto', marginBottom: 'var(--space-6)' }}>
          <div className="form-group">
            <label className="form-label">{t('common.notes')}</label>
            <textarea className="form-input" value={formData.notes} rows={2}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder={isAr ? 'ملاحظات إضافية...' : 'Additional notes...'} />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            ← {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !formData.fullNameAr || !formData.phone}>
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</span>
                {isAr ? 'جاري الحفظ...' : 'Saving...'}
              </span>
            ) : (
              <>✅ {t('common.save')} — {isAr ? 'تحديث البيانات' : 'Update Member'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
