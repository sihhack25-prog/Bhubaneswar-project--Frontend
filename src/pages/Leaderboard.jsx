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
      // Fetch assignments and their submissions instead of global submissions
      const assignmentsRes = await fetch('http://localhost:3001/api/assignments')
      let allSubmissions = []
      
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        const assignments = Array.isArray(assignmentsData) ? assignmentsData : assignmentsData.assignments || []
        
        // Fetch submissions for each assignment
        for (const assignment of assignments) {
          try {
            const subRes = await fetch(`http://localhost:3001/api/assignments/${assignment._id}/submissions`)
            if (subRes.ok) {
              const subData = await subRes.json()
              if (subData.success && subData.submissions) {
                allSubmissions.push(...subData.submissions)
              }
            }
          } catch (err) {
            console.error(`Error fetching submissions for ${assignment._id}:`, err)
          }
        }
      }
      
      // Calculate leaderboard from submissions
      const studentStats = {}
      
      allSubmissions.forEach(sub => {
        const userId = sub.userId?._id || sub.userId || 'unknown'
        const username = sub.userId?.username || sub.username || `Student_${userId}`
        
        if (!studentStats[userId]) {
          studentStats[userId] = {
            userId: userId,
            username: username,
            totalScore: 0,
            submissions: 0,
            passedTests: 0,
            totalTests: 0
          }
        }
        
        studentStats[userId].totalScore += (sub.finalScore || sub.score || 0)
        studentStats[userId].submissions += 1
        studentStats[userId].passedTests += (sub.passedTests || 0)
        studentStats[userId].totalTests += (sub.totalTests || 0)
      })
      
      // Convert to array and calculate averages
      const leaderboard = Object.values(studentStats)
        .filter(student => student.submissions > 0)
        .map(student => ({
          studentId: student.userId,
          studentName: student.username,
          avgScore: Math.round(student.totalScore / student.submissions),
          submissions: student.submissions,
          accuracy: student.totalTests > 0 ? Math.round((student.passedTests / student.totalTests) * 100) : 0,
          improvement: Math.floor(Math.random() * 20) - 10,
          streak: Math.floor(Math.random() * 15) + 1
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .map((student, index) => ({
          ...student,
          rank: index + 1,
          badge: getRankBadge(index + 1)
        }))
      
      setLeaderboardData(leaderboard)
      
      // Find current user's rank
      const currentUserRank = leaderboard.find(s => s.studentId === user?.id)
      setUserRank(currentUserRank)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🏆 Leaderboard
        </h1>
        <p style={{ color: '#6b7280' }}>Compete with your peers and track your progress</p>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: 'white',
          borderRadius: '8px',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
            <Trophy size={120} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px', color: 'white' }}>Your Rank</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px' }}>
                  {getRankIcon(userRank.rank)}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Current Rank</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px' }}>
                  {userRank.avgScore}%
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Average Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '4px' }}>
                  {userRank.submissions}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Submissions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Global Rankings</h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '16px',
            minWidth: '150px'
          }}
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      {/* Leaderboard */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem' }}>Loading leaderboard...</div>
            </div>
          ) : (
          <div>
            {/* Top 3 Podium */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              {leaderboardData.slice(0, 3).map((student, index) => {
                const badge = getRankBadge(student.rank)
                const BadgeIcon = badge.icon
                return (
                  <div key={student.studentId} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      position: 'relative',
                      background: `linear-gradient(135deg, ${badge.color}20, ${badge.color}10)`,
                      borderRadius: '16px',
                      padding: '1.5rem',
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
                        {student.studentName || student.studentId}
                      </h3>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: badge.color, marginBottom: '4px' }}>
                        {student.avgScore}%
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
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
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Rank</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Student</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Score</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Submissions</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Streak</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((student) => {
                    const badge = getRankBadge(student.rank)
                    const BadgeIcon = badge.icon
                    const isCurrentUser = student.studentId === user?.name
                    
                    return (
                      <tr key={student.studentId} style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: isCurrentUser ? '#dbeafe' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => !isCurrentUser && (e.target.closest('tr').style.backgroundColor = '#f9fafb')}
                      onMouseLeave={(e) => !isCurrentUser && (e.target.closest('tr').style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                              fontSize: '16px', 
                              fontWeight: isCurrentUser ? '700' : '600',
                              color: isCurrentUser ? '#3b82f6' : '#111827'
                            }}>
                              {student.studentName || student.studentId}
                              {isCurrentUser && <span style={{ marginLeft: '8px', fontSize: '12px' }}>(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '18px', 
                            fontWeight: '700',
                            color: student.avgScore >= 90 ? '#10b981' : 
                                  student.avgScore >= 75 ? '#f59e0b' : '#ef4444'
                          }}>
                            {student.avgScore}%
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '16px', fontWeight: '600' }}>{student.submissions}</span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            <span style={{ fontSize: '16px' }}>🔥</span>
                            <span style={{ fontSize: '16px', fontWeight: '600' }}>{student.streak}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            {student.improvement > 0 ? (
                              <>
                                <TrendingUp size={16} style={{ color: '#10b981' }} />
                                <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                                  +{student.improvement}%
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingUp size={16} style={{ color: '#ef4444', transform: 'rotate(180deg)' }} />
                                <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>
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
    </div>
  )
}

export default Leaderboard