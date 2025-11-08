import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, TrendingUp, Users, Target, Crown } from 'lucide-react'

const Leaderboard = ({ user }) => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeFilter])

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:3001/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.leaderboard) {
        // Enhanced leaderboard data with more details
        const enhancedLeaderboard = data.leaderboard.map((student, index) => ({
          ...student,
          rank: index + 1,
          badge: getRankBadge(index + 1),
          improvement: Math.floor(Math.random() * 20) - 10, // Mock improvement data
          streak: Math.floor(Math.random() * 15) + 1 // Mock streak data
        }))
        
        setLeaderboardData(enhancedLeaderboard)
        
        // Find current user's rank
        const currentUserRank = enhancedLeaderboard.find(s => s.studentId === user?.username)
        setUserRank(currentUserRank)
      } else {
        setLeaderboardData([])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setLeaderboardData([])
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Crown, color: '#ffd700', label: 'Champion' }
    if (rank === 2) return { icon: Trophy, color: '#c0c0c0', label: 'Runner-up' }
    if (rank === 3) return { icon: Medal, color: '#cd7f32', label: 'Third Place' }
    if (rank <= 10) return { icon: Award, color: '#4f46e5', label: 'Top 10' }
    return { icon: Target, color: '#6b7280', label: 'Participant' }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>🏆 Leaderboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Compete with your peers and track your progress</p>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <div className="card mb-6" style={{ 
          background: 'linear-gradient(135deg, var(--student-primary), var(--student-secondary))',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
            <Trophy size={120} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px', color: 'white' }}>Your Rank</h2>
            <div className="grid grid-4" style={{ gap: '24px' }}>
              <div className="text-center">
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px' }}>
                  {getRankIcon(userRank.rank)}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Current Rank</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px' }}>
                  {userRank.avgScore}%
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Average Score</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px' }}>
                  {userRank.submissions}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Submissions</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px' }}>
                  {userRank.streak}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Day Streak</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Options */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Global Rankings</h2>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '150px' }}
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        {loading ? (
          <div className="text-center" style={{ padding: '60px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px' }}>Loading leaderboard...</p>
          </div>
        ) : (
          <div>
            {/* Top 3 Podium */}
            <div className="grid grid-3 mb-8" style={{ gap: '24px' }}>
              {leaderboardData.slice(0, 3).map((student, index) => {
                const badge = getRankBadge(student.rank)
                const BadgeIcon = badge.icon
                return (
                  <div key={student.studentId} className="text-center">
                    <div style={{ 
                      position: 'relative',
                      background: `linear-gradient(135deg, ${badge.color}20, ${badge.color}10)`,
                      borderRadius: '16px',
                      padding: '24px',
                      border: `2px solid ${badge.color}40`
                    }}>
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: badge.color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: `0 8px 25px ${badge.color}40`
                      }}>
                        <BadgeIcon size={28} style={{ color: 'white' }} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                        {student.studentId}
                      </h3>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: badge.color, marginBottom: '4px' }}>
                        {student.avgScore}%
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {student.submissions} submissions
                      </div>
                      <div style={{ 
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        fontSize: '24px'
                      }}>
                        {getRankIcon(student.rank)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Full Leaderboard Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Rank</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Student</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Score</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Submissions</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Streak</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((student) => {
                    const badge = getRankBadge(student.rank)
                    const BadgeIcon = badge.icon
                    const isCurrentUser = student.studentId === user?.name
                    
                    return (
                      <tr key={student.studentId} style={{ 
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isCurrentUser ? 'var(--student-primary)10' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => !isCurrentUser && (e.target.closest('tr').style.backgroundColor = 'var(--bg-secondary)')}
                      onMouseLeave={(e) => !isCurrentUser && (e.target.closest('tr').style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '16px' }}>
                          <div className="flex items-center gap-3">
                            <div style={{ 
                              width: '32px', 
                              height: '32px', 
                              background: badge.color,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <BadgeIcon size={16} style={{ color: 'white' }} />
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: '700' }}>
                              {getRankIcon(student.rank)}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="flex items-center gap-2">
                            <span style={{ 
                              fontSize: '16px', 
                              fontWeight: isCurrentUser ? '700' : '600',
                              color: isCurrentUser ? 'var(--student-primary)' : 'var(--text-primary)'
                            }}>
                              {student.studentId}
                              {isCurrentUser && <span style={{ marginLeft: '8px', fontSize: '12px' }}>(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '18px', 
                            fontWeight: '700',
                            color: student.avgScore >= 90 ? 'var(--success)' : 
                                  student.avgScore >= 75 ? 'var(--warning)' : 'var(--danger)'
                          }}>
                            {student.avgScore}%
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ fontSize: '16px', fontWeight: '600' }}>{student.submissions}</span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1">
                            <span style={{ fontSize: '16px' }}>🔥</span>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>{student.streak}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div className="flex items-center justify-center gap-1">
                            {student.improvement > 0 ? (
                              <>
                                <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                                <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '600' }}>
                                  +{student.improvement}%
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingUp size={16} style={{ color: 'var(--danger)', transform: 'rotate(180deg)' }} />
                                <span style={{ color: 'var(--danger)', fontSize: '14px', fontWeight: '600' }}>
                                  {student.improvement}%
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard