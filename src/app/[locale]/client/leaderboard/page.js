'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function LeaderboardPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params?.locale || 'ar';
  const [activeBoard, setActiveBoard] = useState('attendance');

  const myId = 'PT-0001';

  const boards = {
    attendance: {
      title: locale === 'ar' ? 'أكثر حضوراً' : 'Most Visits',
      icon: '🏆',
      data: [
        { rank: 1, id: 'PT-0045', name: 'خالد أحمد حسين', level: 12, visits: 26, streak: 18, avatar: 'خ', change: 0 },
        { rank: 2, id: 'PT-0012', name: 'محمد علي سعيد', level: 10, visits: 24, streak: 14, avatar: 'م', change: 1 },
        { rank: 3, id: 'PT-0089', name: 'يوسف حسام', level: 9, visits: 23, streak: 10, avatar: 'ي', change: -1 },
        { rank: 4, id: 'PT-0033', name: 'سارة محمد عبدالله', level: 8, visits: 22, streak: 8, avatar: 'س', change: 2 },
        { rank: 5, id: myId, name: 'أحمد محمد سعيد', level: 7, visits: 18, streak: 6, avatar: 'أ', change: 0, isMe: true },
        { rank: 6, id: 'PT-0067', name: 'نور أحمد', level: 7, visits: 17, streak: 5, avatar: 'ن', change: -1 },
        { rank: 7, id: 'PT-0022', name: 'عمر حسن مصطفى', level: 6, visits: 16, streak: 4, avatar: 'ع', change: 3 },
        { rank: 8, id: 'PT-0055', name: 'فاطمة علي', level: 6, visits: 15, streak: 3, avatar: 'ف', change: 0 },
        { rank: 9, id: 'PT-0071', name: 'كريم سامي', level: 5, visits: 14, streak: 2, avatar: 'ك', change: -2 },
        { rank: 10, id: 'PT-0099', name: 'هدى عادل', level: 5, visits: 13, streak: 1, avatar: 'ه', change: 1 },
      ]
    },
    xp: {
      title: locale === 'ar' ? 'أعلى XP' : 'Top XP',
      icon: '⭐',
      data: [
        { rank: 1, name: 'خالد أحمد حسين', level: 12, xp: 4500, avatar: 'خ', change: 0 },
        { rank: 2, name: 'محمد علي سعيد', level: 10, xp: 3800, avatar: 'م', change: 0 },
        { rank: 3, name: 'يوسف حسام', level: 9, xp: 3200, avatar: 'ي', change: 1 },
        { rank: 4, name: 'سارة محمد عبدالله', level: 8, xp: 2900, avatar: 'س', change: -1 },
        { rank: 5, name: 'أحمد محمد سعيد', level: 7, xp: 2350, avatar: 'أ', change: 2, isMe: true },
      ]
    },
    volume: {
      title: locale === 'ar' ? 'أعلى حجم تدريب' : 'Top Volume',
      icon: '💪',
      data: [
        { rank: 1, name: 'محمد علي سعيد', level: 10, volume: '245K', avatar: 'م', change: 1 },
        { rank: 2, name: 'خالد أحمد حسين', level: 12, volume: '230K', avatar: 'خ', change: -1 },
        { rank: 3, name: 'عمر حسن مصطفى', level: 6, volume: '198K', avatar: 'ع', change: 2 },
        { rank: 4, name: 'أحمد محمد سعيد', level: 7, volume: '157K', avatar: 'أ', change: 0, isMe: true },
        { rank: 5, name: 'يوسف حسام', level: 9, volume: '145K', avatar: 'ي', change: -1 },
      ]
    },
    streak: {
      title: locale === 'ar' ? 'أطول سلسلة' : 'Longest Streak',
      icon: '🔥',
      data: [
        { rank: 1, name: 'خالد أحمد حسين', level: 12, streak: 32, avatar: 'خ', change: 0 },
        { rank: 2, name: 'سارة محمد عبدالله', level: 8, streak: 24, avatar: 'س', change: 0 },
        { rank: 3, name: 'محمد علي سعيد', level: 10, streak: 18, avatar: 'م', change: 1 },
        { rank: 4, name: 'يوسف حسام', level: 9, streak: 14, avatar: 'ي', change: -1 },
        { rank: 5, name: 'أحمد محمد سعيد', level: 7, streak: 6, avatar: 'أ', change: 3, isMe: true },
      ]
    },
  };

  const currentBoard = boards[activeBoard];
  const myRank = currentBoard.data.find(d => d.isMe);

  const rankColors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
  const rankEmoji = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1><span>🏆</span> {locale === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}</h1>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--pt-gray-500)' }}>
          📅 {locale === 'ar' ? 'مارس 2026' : 'March 2026'}
        </span>
      </div>

      {/* My Position Highlight */}
      {myRank && (
        <div className="card" style={{ marginBottom: 'var(--space-5)', background: 'linear-gradient(135deg, rgba(245,197,24,0.08) 0%, rgba(245,197,24,0.02) 100%)', borderTop: '3px solid var(--pt-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-full)', background: 'rgba(245,197,24,0.15)', color: 'var(--pt-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900 }}>أ</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--font-size-lg)' }}>{locale === 'ar' ? 'ترتيبك الحالي' : 'Your Position'}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--pt-gray-500)' }}>
                  Lv.{myRank.level} • {locale === 'ar' ? 'أحمد محمد سعيد' : 'Ahmed Mohamed Said'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 900, color: 'var(--pt-gold)' }}>#{myRank.rank}</div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>{locale === 'ar' ? 'من 245 عضو' : 'of 245 members'}</div>
              </div>
              {myRank.change !== 0 && (
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: myRank.change > 0 ? 'var(--pt-success)' : 'var(--pt-danger)' }}>
                  {myRank.change > 0 ? `↑ +${myRank.change}` : `↓ ${myRank.change}`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Board Selector */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
        {Object.entries(boards).map(([key, board]) => (
          <button key={key} onClick={() => setActiveBoard(key)}
            className={`btn ${activeBoard === key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            style={{ whiteSpace: 'nowrap' }}>
            {board.icon} {board.title}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', alignItems: 'flex-end' }}>
        {[1, 0, 2].map(idx => {
          const person = currentBoard.data[idx];
          if (!person) return null;
          const isFirst = person.rank === 1;
          return (
            <div key={idx} style={{ textAlign: 'center', flex: '0 0 140px' }}>
              <div style={{
                width: isFirst ? 72 : 56, height: isFirst ? 72 : 56,
                borderRadius: 'var(--radius-full)', margin: '0 auto var(--space-2)',
                background: `rgba(${person.rank === 1 ? '255,215,0' : person.rank === 2 ? '192,192,192' : '205,127,50'},0.15)`,
                border: `3px solid ${rankColors[person.rank]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isFirst ? '1.8rem' : '1.3rem', fontWeight: 900, color: rankColors[person.rank],
              }}>
                {person.avatar}
              </div>
              <div style={{ fontSize: '1.4rem' }}>{rankEmoji[person.rank]}</div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>{person.name.split(' ').slice(0, 2).join(' ')}</div>
              <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>Lv.{person.level}</div>
              <div style={{
                padding: 'var(--space-1) var(--space-3)', background: isFirst ? 'rgba(255,215,0,0.1)' : 'var(--pt-darker)',
                borderRadius: 'var(--radius-full)', display: 'inline-block', marginTop: '4px',
                fontWeight: 800, fontSize: 'var(--font-size-sm)', color: rankColors[person.rank],
              }}>
                {person.visits ? `${person.visits} ${locale === 'ar' ? 'زيارة' : 'visits'}` :
                 person.xp ? `${person.xp} XP` :
                 person.volume ? `${person.volume} kg` :
                 person.streak ? `🔥 ${person.streak} ${locale === 'ar' ? 'يوم' : 'days'}` : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Rankings Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)' }}>
          {currentBoard.icon} {currentBoard.title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {currentBoard.data.map((person, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
              padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)',
              background: person.isMe ? 'rgba(245,197,24,0.08)' : 'var(--pt-darker)',
              border: person.isMe ? '1px solid rgba(245,197,24,0.3)' : '1px solid transparent',
            }}>
              <div style={{ width: 30, textAlign: 'center', fontWeight: 900, fontSize: person.rank <= 3 ? 'var(--font-size-lg)' : 'var(--font-size-sm)', color: rankColors[person.rank] || 'var(--pt-gray-500)' }}>
                {rankEmoji[person.rank] || `#${person.rank}`}
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: person.isMe ? 'rgba(245,197,24,0.15)' : 'rgba(255,255,255,0.05)', color: person.isMe ? 'var(--pt-gold)' : 'var(--pt-gray-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{person.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: person.isMe ? 700 : 500, fontSize: 'var(--font-size-sm)' }}>
                  {person.name} {person.isMe && <span style={{ color: 'var(--pt-gold)', fontSize: '10px' }}>({locale === 'ar' ? 'أنت' : 'YOU'})</span>}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--pt-gray-600)' }}>Lv.{person.level}</div>
              </div>
              <div style={{ fontWeight: 800, color: person.isMe ? 'var(--pt-gold)' : 'var(--pt-gray-400)', fontSize: 'var(--font-size-sm)' }}>
                {person.visits ? `${person.visits}` : person.xp ? `${person.xp}` : person.volume || (person.streak ? `🔥${person.streak}` : '')}
              </div>
              <div style={{ width: 40, textAlign: 'center', fontSize: '11px', fontWeight: 700, color: person.change > 0 ? 'var(--pt-success)' : person.change < 0 ? 'var(--pt-danger)' : 'var(--pt-gray-700)' }}>
                {person.change > 0 ? `↑${person.change}` : person.change < 0 ? `↓${Math.abs(person.change)}` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
