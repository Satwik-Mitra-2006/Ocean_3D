import React from 'react';
import { 
  Radio, 
  Thermometer, 
  Droplets, 
  Wind, 
  TrendingUp, 
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function SummaryCards({ 
  selectedStationData, 
  stationsCount = { active: 24, total: 26, warning: 1, offline: 1 } 
}) {
  // If a station is selected, display its live values; otherwise display oceanographic regional averages
  const isStationActive = Boolean(selectedStationData);

  const stats = [
    {
      id: 'stations',
      title: 'Active Stations',
      value: isStationActive ? selectedStationData.code : `${stationsCount.active}`,
      subtext: isStationActive 
        ? `${selectedStationData.status} • ${selectedStationData.region}`
        : `${stationsCount.total} total deployed in Indian Ocean`,
      icon: Radio,
      color: 'sky',
      badge: isStationActive ? selectedStationData.status : '92% Online',
      badgeColor: isStationActive 
        ? (selectedStationData.status === 'Active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200')
        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      id: 'temperature',
      title: isStationActive ? 'Station Temperature' : 'Ocean Temperature',
      value: isStationActive ? `${selectedStationData.currentTemp} °C` : '27.4 °C',
      subtext: isStationActive ? `Depth: ${selectedStationData.depth}m subsurface` : 'Regional mean sea surface',
      icon: Thermometer,
      color: 'cyan',
      badge: '+0.4°C vs Climatology',
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200'
    },
    {
      id: 'salinity',
      title: isStationActive ? 'Station Salinity' : 'Avg Salinity',
      value: isStationActive ? `${selectedStationData.currentSalinity} PSU` : '35.2 PSU',
      subtext: isStationActive ? `Sensor: Conductivity Cell` : 'Practical Salinity Scale (PSS-78)',
      icon: Droplets,
      color: 'teal',
      badge: 'Normal Range',
      badgeColor: 'text-teal-700 bg-teal-50 border-teal-200'
    },
    {
      id: 'current',
      title: isStationActive ? 'Station Drift Speed' : 'Current Speed',
      value: isStationActive ? `${selectedStationData.currentSpeed} m/s` : '1.24 m/s',
      subtext: isStationActive ? `Heading: ${selectedStationData.direction}` : 'Surface geostrophic velocity',
      icon: Wind,
      color: 'blue',
      badge: isStationActive ? `Wave: ${selectedStationData.currentWave}m` : 'Moderate Drift',
      badgeColor: 'text-blue-700 bg-blue-50 border-blue-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group"
          >
            {/* Ambient accent top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-teal-400 opacity-80" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {stat.value}
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 truncate max-w-[170px]" title={stat.subtext}>
                {stat.subtext}
              </span>
              <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] border shrink-0 ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
