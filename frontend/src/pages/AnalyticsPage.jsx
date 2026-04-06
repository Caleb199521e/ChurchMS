import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from '../components/common/Toaster';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import BarChartIcon from '@mui/icons-material/BarChart';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(6);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchData();
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, branchesRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/branches')
      ]);
      
      setStats(statsRes.data.data);
      setBranches(branchesRes.data.data || []);
      
      // Set first two branches as default for comparison
      if (branchesRes.data.data?.length >= 2) {
        setSelectedBranches([
          branchesRes.data.data[0]._id,
          branchesRes.data.data[1]._id
        ]);
      } else if (branchesRes.data.data?.length === 1) {
        setSelectedBranches([branchesRes.data.data[0]._id]);
      }
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranches.length > 0 && isSuperAdmin) {
      fetchComparisonData();
    }
  }, [selectedBranches, timeframe, isSuperAdmin]);

  const fetchComparisonData = async () => {
    try {
      const res = await api.get('/analytics/compare', {
        params: {
          branchIds: selectedBranches.join(','),
          metric: 'all',
          months: timeframe
        }
      });
      setComparisonData(res.data.data);
    } catch (err) {
      toast.error('Failed to load comparison data');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <PageHeader title="Analytics & Reports" subtitle="System analytics and branch performance" />
        <div className="card text-center py-14">
          <BarChartIcon sx={{ fontSize: 60, color: '#9ca3af' }} />
          <p className="text-gray-400 mt-3">Access denied. Only super-admins can view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Analytics & Reports" 
        subtitle="Track and compare branch performance metrics"
      />

      {loading ? (
        <LoadingSpinner text="Loading analytics..." />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              icon={GroupsIcon}
              label="Total Members"
              value={stats?.summary?.totalMembers}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard 
              icon={PeopleIcon}
              label="Total Visitors"
              value={stats?.summary?.totalVisitors}
              color="bg-green-50 text-green-600"
            />
            <StatCard 
              icon={BarChartIcon}
              label="Attendance Records"
              value={stats?.summary?.totalAttendanceRecords}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard 
              icon={TrendingUpIcon}
              label="Active Branches"
              value={stats?.summary?.totalBranches}
              color="bg-orange-50 text-orange-600"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1 w-full md:w-fit">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'compare', label: 'Branch Comparison' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-white text-brand shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Branch Stats Table */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">Branch Statistics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Branch Name</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Members</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Visitors</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600">Attendance Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.branches?.map((branch, idx) => (
                        <tr key={branch._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              ></div>
                              <span className="font-medium text-gray-900">{branch.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{branch.totalMembers}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{branch.totalVisitors}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">{branch.totalAttendanceRecords}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4">Comparison Settings</h3>
                
                <div className="space-y-4">
                  {/* Timeframe */}
                  <div>
                    <label className="label">Time Period (months)</label>
                    <select
                      className="input w-full md:w-48"
                      value={timeframe}
                      onChange={(e) => setTimeframe(parseInt(e.target.value))}
                    >
                      <option value={3}>Last 3 months</option>
                      <option value={6}>Last 6 months</option>
                      <option value={12}>Last 12 months</option>
                      <option value={24}>Last 24 months</option>
                    </select>
                  </div>

                  {/* Branch Selection */}
                  <div>
                    <label className="label">Select Branches to Compare</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {branches.map(branch => (
                        <label key={branch._id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(branch._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBranches([...selectedBranches, branch._id]);
                              } else {
                                setSelectedBranches(selectedBranches.filter(id => id !== branch._id));
                              }
                            }}
                            className="w-4 h-4 text-brand"
                          />
                          <span className="font-medium text-gray-900">{branch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Charts */}
              {comparisonData && selectedBranches.length > 0 && (
                <div className="space-y-6">
                  {/* Member Growth Summary */}
                  {comparisonData?.comparisons?.some(c => c.data.memberTrend?.length > 0) && (
                    <MemberGrowthSummary data={comparisonData.comparisons} timeframe={timeframe} />
                  )}

                  {/* Member Growth Comparison */}
                  {comparisonData?.comparisons?.some(c => c.data.memberTrend?.length > 0) && (
                    <div className="card">
                      <h3 className="font-bold text-gray-900 mb-4">Member Growth Comparison</h3>
                      <MemberGrowthChart data={comparisonData.comparisons} />
                    </div>
                  )}

                  {/* Attendance Trend Comparison */}
                  {comparisonData?.comparisons?.some(c => c.data.attendanceTrend?.length > 0) && (
                    <div className="card">
                      <h3 className="font-bold text-gray-900 mb-4">Attendance Trend Comparison</h3>
                      <AttendanceTrendChart data={comparisonData.comparisons} />
                    </div>
                  )}

                  {/* Visitor Trend Comparison */}
                  {comparisonData?.comparisons?.some(c => c.data.visitorTrend?.length > 0) && (
                    <div className="card">
                      <h3 className="font-bold text-gray-900 mb-4">New Visitors Comparison</h3>
                      <VisitorTrendChart data={comparisonData.comparisons} />
                    </div>
                  )}

                  {/* Key Metrics Comparison */}
                  <div className="card">
                    <h3 className="font-bold text-gray-900 mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comparisonData?.comparisons?.map((comp, idx) => {
                        const totalNewMembers = (comp.data.memberTrend || []).reduce((sum, m) => sum + (m.newMembers || 0), 0);
                        const currentTotal = comp.data.totalMembers || 0;
                        const previousTotal = Math.max(0, currentTotal - totalNewMembers);
                        const growthRate = previousTotal > 0 ? ((totalNewMembers / previousTotal) * 100).toFixed(1) : 100;
                        
                        return (
                          <div key={comp.branch._id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-4">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                              ></div>
                              <h4 className="font-semibold text-gray-900">{comp.branch.name}</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between pb-2 border-b border-gray-100">
                                <span className="text-gray-600">Total Members:</span>
                                <span className="font-semibold text-gray-900">{currentTotal}</span>
                              </div>
                              <div className="flex justify-between pb-2 border-b border-gray-100">
                                <span className="text-gray-600">New Members:</span>
                                <span className="font-semibold" style={{ color: COLORS[idx % COLORS.length] }}>+{totalNewMembers}</span>
                              </div>
                              <div className="flex justify-between pb-2 border-b border-gray-100">
                                <span className="text-gray-600">Growth Rate:</span>
                                <span className="font-semibold" style={{ color: COLORS[idx % COLORS.length] }}>{growthRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Visitors:</span>
                                <span className="font-semibold text-gray-900">{comp.data.totalVisitors || 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`card ${color} p-6`}>
      <div className="flex items-center gap-4">
        <div className="text-3xl">
          <Icon sx={{ fontSize: 40 }} />
        </div>
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold">{value ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}

function MemberGrowthSummary({ data, timeframe }) {
  const growthMetrics = data.map((comp, idx) => {
    const memberTrend = comp.data.memberTrend || [];
    const totalNewMembers = memberTrend.reduce((sum, m) => sum + (m.newMembers || 0), 0);
    const currentTotal = comp.data.totalMembers || 0;
    const previousTotal = Math.max(0, currentTotal - totalNewMembers);
    const growthRate = previousTotal > 0 ? ((totalNewMembers / previousTotal) * 100).toFixed(1) : 100;
    
    return {
      branch: comp.branch,
      totalNewMembers,
      currentTotal,
      growthRate,
      color: COLORS[idx % COLORS.length]
    };
  });

  const sortedMetrics = [...growthMetrics].sort((a, b) => b.totalNewMembers - a.totalNewMembers);

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">Member Growth Summary</h3>
        <p className="text-xs text-gray-500">Last {timeframe} months</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedMetrics.map((metric) => (
          <div
            key={metric.branch._id}
            className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition"
            style={{ borderLeftWidth: '4px', borderLeftColor: metric.color }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{metric.branch.name}</h4>
                <p className="text-xs text-gray-500 mt-1">Total Members: {metric.currentTotal}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: metric.color }}>
                  +{metric.totalNewMembers}
                </div>
                <p className="text-xs text-gray-500">new members</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <div className="text-sm font-medium text-gray-600">Growth Rate</div>
                <div className="text-xs text-gray-500">vs previous period</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: metric.color }}>
                  {metric.growthRate}%
                </div>
              </div>
            </div>

            {/* Growth Bar */}
            <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, Math.max(0, parseFloat(metric.growthRate)))}%`,
                  backgroundColor: metric.color 
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Ranking */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-3">Growth Rankings</h4>
        <div className="space-y-2">
          {sortedMetrics.map((metric, idx) => (
            <div key={metric.branch._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: metric.color }}>
                  {idx + 1}
                </div>
                <span className="text-sm font-medium text-gray-900">{metric.branch.name}</span>
              </div>
              <span className="text-sm font-semibold" style={{ color: metric.color }}>
                +{metric.totalNewMembers} ({metric.growthRate}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberGrowthChart({ data }) {
  // Aggregate member data from all branches
  const monthLabels = [];
  const datasets = [];

  data.forEach((comp, idx) => {
    if (!comp.data.memberTrend) return;

    const memberCounts = comp.data.memberTrend.map(m => m.newMembers || 0);
    const labels = comp.data.memberTrend.map(m => `${m._id.month}/${m._id.year}`);
    
    labels.forEach(label => {
      if (!monthLabels.includes(label)) monthLabels.push(label);
    });

    datasets.push({
      label: comp.branch.name,
      data: memberCounts,
      borderColor: COLORS[idx % COLORS.length],
      backgroundColor: COLORS[idx % COLORS.length] + '20',
      tension: 0.4,
      fill: true
    });
  });

  const chartData = {
    labels: monthLabels,
    datasets
  };

  return (
    <div className="relative h-80">
      <Line 
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }}
      />
    </div>
  );
}

function AttendanceTrendChart({ data }) {
  const monthLabels = [];
  const datasets = [];

  data.forEach((comp, idx) => {
    if (!comp.data.attendanceTrend) return;

    const attendanceCounts = comp.data.attendanceTrend.map(a => a.avgAttendance || 0);
    const labels = comp.data.attendanceTrend.map(a => `${a._id.month}/${a._id.year}`);
    
    labels.forEach(label => {
      if (!monthLabels.includes(label)) monthLabels.push(label);
    });

    datasets.push({
      label: comp.branch.name,
      data: attendanceCounts,
      backgroundColor: COLORS[idx % COLORS.length],
      borderColor: COLORS[idx % COLORS.length],
      borderWidth: 1
    });
  });

  const chartData = {
    labels: monthLabels,
    datasets
  };

  return (
    <div className="relative h-80">
      <Bar 
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }}
      />
    </div>
  );
}

function VisitorTrendChart({ data }) {
  const monthLabels = [];
  const datasets = [];

  data.forEach((comp, idx) => {
    if (!comp.data.visitorTrend) return;

    const visitorCounts = comp.data.visitorTrend.map(v => v.count || 0);
    const labels = comp.data.visitorTrend.map(v => `${v._id.month}/${v._id.year}`);
    
    labels.forEach(label => {
      if (!monthLabels.includes(label)) monthLabels.push(label);
    });

    datasets.push({
      label: comp.branch.name,
      data: visitorCounts,
      borderColor: COLORS[idx % COLORS.length],
      backgroundColor: COLORS[idx % COLORS.length] + '20',
      tension: 0.4,
      fill: true
    });
  });

  const chartData = {
    labels: monthLabels,
    datasets
  };

  return (
    <div className="relative h-80">
      <Line 
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }}
      />
    </div>
  );
}
