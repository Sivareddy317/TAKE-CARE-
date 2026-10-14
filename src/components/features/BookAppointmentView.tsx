import React, { useState } from 'react';

interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  experience: string;
  rating: number;
  availableSlots: string[];
}

const DOCTORS: DoctorItem[] = [
  {
    id: 'doc-1',
    name: 'Dr. K. Swaminathan',
    specialty: 'ENT Specialist',
    clinic: 'Apollo Clinic, Chembur',
    experience: '14 yrs exp',
    rating: 4.9,
    availableSlots: ['Today 04:30 PM', 'Today 06:00 PM', 'Tomorrow 10:30 AM'],
  },
  {
    id: 'doc-2',
    name: 'Dr. S. Rajan',
    specialty: 'General Physician',
    clinic: 'City Care Hospital, Bandra',
    experience: '18 yrs exp',
    rating: 4.8,
    availableSlots: ['Today 05:00 PM', 'Tomorrow 11:00 AM', 'Tomorrow 03:00 PM'],
  },
  {
    id: 'doc-3',
    name: 'Dr. Ananya Sen',
    specialty: 'Diabetologist & Endocrinologist',
    clinic: 'Metropolis Diabetes Clinic',
    experience: '12 yrs exp',
    rating: 4.9,
    availableSlots: ['Tomorrow 09:30 AM', 'Tomorrow 02:00 PM', 'Fri 11:30 AM'],
  },
];

interface BookAppointmentViewProps {
  onBack: () => void;
}

export const BookAppointmentView: React.FC<BookAppointmentViewProps> = ({ onBack }) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [consultType, setConsultType] = useState<'clinic' | 'video'>('clinic');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const specialties = ['All', 'General Physician', 'ENT Specialist', 'Diabetologist & Endocrinologist'];

  const filteredDoctors =
    selectedSpecialty === 'All'
      ? DOCTORS
      : DOCTORS.filter((d) => d.specialty === selectedSpecialty);

  const handleConfirm = () => {
    if (!selectedDoctor || !selectedSlot) return;
    setBookingConfirmed(true);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto pb-20 space-y-4 animate-fadeIn select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Book Appointment</h1>
            <p className="text-xs text-slate-500">Consult with certified clinicians</p>
          </div>
        </div>
      </div>

      {bookingConfirmed ? (
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Appointment Confirmed!</h2>
            <p className="text-xs text-slate-500">
              Your consultation has been booked successfully.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Doctor:</span>
              <span className="font-bold text-slate-900">{selectedDoctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Specialty:</span>
              <span className="font-semibold text-slate-700">{selectedDoctor?.specialty}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Slot:</span>
              <span className="font-bold text-emerald-700">{selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Type:</span>
              <span className="font-semibold text-slate-800 capitalize">{consultType} Consultation</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Clinic:</span>
              <span className="text-slate-600">{selectedDoctor?.clinic}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 bg-[#006D60] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Specialty Selector Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSpecialty(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedSpecialty === s
                    ? 'bg-[#006D60] text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setConsultType('clinic')}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                consultType === 'clinic' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">local_hospital</span>
              <span>In-Clinic Visit</span>
            </button>
            <button
              type="button"
              onClick={() => setConsultType('video')}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                consultType === 'video' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">video_call</span>
              <span>Video Consult</span>
            </button>
          </div>

          {/* Doctors List */}
          <div className="space-y-3">
            {filteredDoctors.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setSelectedSlot(doc.availableSlots[0]);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#006D60] ring-2 ring-[#006D60]/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#006D60] flex items-center justify-center font-bold text-lg flex-shrink-0 border border-teal-200">
                        {doc.name.split(' ')[1]?.[0] || 'D'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                        <p className="text-xs text-[#006D60] font-semibold">{doc.specialty}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{doc.clinic}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                        ⭐ {doc.rating}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">{doc.experience}</p>
                    </div>
                  </div>

                  {/* Slot Selection (if doctor is selected) */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-fadeIn">
                      <p className="text-[11px] font-bold text-slate-700">Available Slots:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSlot(slot);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              selectedSlot === slot
                                ? 'bg-[#006D60] text-white shadow-2xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedSlot}
                        className="w-full mt-2 py-2.5 bg-[#006D60] hover:bg-[#005248] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                      >
                        Confirm Booking ({selectedSlot})
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
