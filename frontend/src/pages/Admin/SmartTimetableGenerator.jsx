import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import { 
  Calendar, 
  BookOpen, 
  Coffee, 
  Save, 
  Download,
  Plus,
  RotateCcw,
  Shuffle,
  FileText
} from 'lucide-react';
import api from '../../services/api';

const ITEM_TYPE = 'SUBJECT_SLOT';

// Days of the week
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Time slots (based on the image)
const TIME_SLOTS = [
  { start: '8:30', end: '9:30', label: '8:30 TO 9:30' },
  { start: '9:30', end: '10:30', label: '9:30 TO 10:30' },
  { start: '10:30', end: '10:45', label: '10:30-10:45', type: 'break' },
  { start: '10:45', end: '11:45', label: '10:45 TO 11:45' },
  { start: '11:45', end: '12:45', label: '11:45 TO 12:45' },
  { start: '12:45', end: '1:20', label: '12:45-1:20', type: 'break' },
  { start: '1:20', end: '2:20', label: '1:20 TO 2:20' },
  { start: '2:20', end: '3:20', label: '2:20 TO 3:20' },
  { start: '3:20', end: '4:20', label: '3:20 TO 4:20' }
];

// Draggable Subject Component
const DraggableSubject = ({ subject, isInPalette = true }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { ...subject, isInPalette },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        p-2 rounded cursor-move border text-xs font-medium transition-all
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isInPalette 
          ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200' 
          : 'bg-green-100 border-green-300 text-green-800 min-h-[60px] flex flex-col justify-center'
        }
      `}
      title={`${subject.code} - ${subject.name}\nTeacher: ${subject.teacher}\nRoom: ${subject.room || 'TBD'}`}
    >
      <div className="font-semibold">{subject.code}</div>
      <div className="text-xs opacity-75">{subject.teacher}</div>
      {subject.room && <div className="text-xs opacity-60">{subject.room}</div>}
    </div>
  );
};

// Drop Zone for time slots
const TimeSlotDropZone = ({ day, timeSlot, subjects, onDrop, onRemove }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item) => onDrop(day, timeSlot, item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const slotSubjects = subjects.filter(s => s.day === day && s.timeSlot === timeSlot.label);
  const isBreak = timeSlot.type === 'break';

  if (isBreak) {
    return (
      <div className="bg-orange-50 border border-orange-200 p-2 text-center text-orange-700 font-medium min-h-[60px] flex items-center justify-center">
        <Coffee className="w-4 h-4 mr-1" />
        {timeSlot.label.includes('LUNCH') ? 'LUNCH BREAK' : 'SHORT BREAK'}
      </div>
    );
  }

  return (
    <div
      ref={drop}
      className={`
        min-h-[60px] border-2 border-dashed rounded p-1 transition-all
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}
        ${slotSubjects.length > 0 ? 'bg-white border-solid border-gray-300' : ''}
      `}
    >
      {slotSubjects.length > 0 ? (
        slotSubjects.map((subject, index) => (
          <div key={index} className="relative group">
            <DraggableSubject subject={subject} isInPalette={false} />
            <button
              onClick={() => onRemove(subject)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-xs">
          Drop subject here
        </div>
      )}
    </div>
  );
};

const SmartTimetableGenerator = () => {
  const [timetableData, setTimetableData] = useState({
    class: '',
    section: '',
    semester: '',
    academicYear: '2025-26',
    department: 'COMPUTER ENGINEERING',
    coordinators: {
      tt: 'PROF. MOHINI A. THORAT',
      class: 'PROF. MOHINI A. THORAT',
      hod: ''
    }
  });

  const [subjects, setSubjects] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    code: '',
    name: '',
    teacher: '',
    room: ''
  });

  // Default subjects based on the image
  useEffect(() => {
    const defaultSubjects = [
      { code: 'BCT-DRK', name: 'Basic Computer Technology', teacher: 'Dr. K. Sharma', room: 'Lab-1' },
      { code: 'EL-IV-RSD', name: 'Electronics IV', teacher: 'Prof. R.S. Desai', room: 'Room-101' },
      { code: 'EL-III-MP', name: 'Electronics III', teacher: 'Prof. M. Patil', room: 'Room-102' },
      { code: 'MI-MAT', name: 'Mathematics', teacher: 'Prof. M. Thakur', room: 'Room-201' },
      { code: 'DAA-DUI', name: 'Data Structures', teacher: 'Prof. D.U. Iyer', room: 'Lab-2' },
      { code: 'AC-7-MAT', name: 'Advanced Computing', teacher: 'Prof. A. Chavan', room: 'Lab-3' },
      { code: 'TNS-AS', name: 'Technical Skills', teacher: 'Prof. A. Singh', room: 'Room-301' },
      { code: 'PROJECT WORK', name: 'Project Work', teacher: 'Multiple', room: 'Lab-4' }
    ];
    setSubjects(defaultSubjects);
  }, []);

  const handleDrop = useCallback((day, timeSlot, draggedItem) => {
    if (timeSlot.type === 'break') return;

    const newSubject = {
      ...draggedItem,
      day,
      timeSlot: timeSlot.label,
      id: `${day}-${timeSlot.label}-${Date.now()}`
    };

    // Check if slot is already occupied
    const existingSubject = assignedSubjects.find(
      s => s.day === day && s.timeSlot === timeSlot.label
    );

    if (existingSubject) {
      toast.warning('This time slot is already occupied!');
      return;
    }

    setAssignedSubjects(prev => [...prev, newSubject]);
    toast.success(`${draggedItem.code} assigned to ${day} ${timeSlot.label}`);
  }, [assignedSubjects]);

  const handleRemoveSubject = useCallback((subjectToRemove) => {
    setAssignedSubjects(prev => prev.filter(s => s.id !== subjectToRemove.id));
    toast.info('Subject removed from timetable');
  }, []);

  const generateAutoTimetable = () => {
    const newAssignments = [];
    const subjectPool = [...subjects];
    let subjectIndex = 0;
    
    DAYS.forEach(day => {
      const regularSlots = TIME_SLOTS.filter(slot => slot.type !== 'break');
      
      regularSlots.forEach((slot) => {
        if (subjectPool.length > 0) {
          const subject = subjectPool[subjectIndex % subjectPool.length];
          
          newAssignments.push({
            ...subject,
            day,
            timeSlot: slot.label,
            id: `${day}-${slot.label}-${Date.now()}-${subjectIndex}`
          });
          
          subjectIndex++;
        }
      });
    });

    setAssignedSubjects(newAssignments);
    toast.success('Auto-filled timetable created!');
  };

  const clearTimetable = () => {
    setAssignedSubjects([]);
    toast.info('Timetable cleared');
  };

  const saveTimetable = async () => {
    try {
      const dayMap = {
        'MON': 'Monday',
        'TUE': 'Tuesday',
        'WED': 'Wednesday',
        'THU': 'Thursday',
        'FRI': 'Friday',
        'SAT': 'Saturday'
      };

      const mappedSlots = assignedSubjects.map(sub => {
        let startTime = '', endTime = '';
        if (sub.timeSlot.includes(' TO ')) {
          [startTime, endTime] = sub.timeSlot.split(' TO ');
        } else if (sub.timeSlot.includes('-')) {
          [startTime, endTime] = sub.timeSlot.split('-');
        }

        const formatTime = (t) => {
          if (!t) return '';
          const parts = t.trim().split(':');
          if (parts.length === 2) {
            let h = parseInt(parts[0], 10);
            if (h >= 1 && h <= 5) h += 12;
            return `${h.toString().padStart(2, '0')}:${parts[1]}`;
          }
          return t.trim();
        };

        return {
          day: dayMap[sub.day] || sub.day,
          startTime: formatTime(startTime),
          endTime: formatTime(endTime),
          subject: sub.name,
          teacher: sub.teacher, 
          location: sub.room
        };
      });

      const timetablePayload = {
        ...timetableData,
        slots: mappedSlots,
        subjects: subjects
      };

      await api.post('/timetables', timetablePayload);
      toast.success('Timetable saved successfully!');
    } catch (error) {
      toast.error('Failed to save timetable');
      console.error(error);
    }
  };

  const exportTimetable = () => {
    const data = {
      timetableData,
      assignedSubjects,
      subjects
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetable-${timetableData.class}-${timetableData.section}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Timetable exported successfully!');
  };

  const exportTimetableAsPDF = () => {
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Set up PDF dimensions and margins
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    let yPosition = margin;

    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${timetableData.department} DEPARTMENT`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.setFontSize(14);
    pdf.text(`${timetableData.class} TIME TABLE (SEM-II) DIV${timetableData.section}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    pdf.setFontSize(12);
    pdf.text(`ACADEMIC YEAR ${timetableData.academicYear}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Table settings
    const startX = margin;
    const startY = yPosition;
    const rowHeight = 20;
    const colWidths = [25]; // First column width
    const timeSlotWidth = (pageWidth - margin * 2 - colWidths[0]) / TIME_SLOTS.length;
    
    // Add time slot widths
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      colWidths.push(timeSlotWidth);
    }

    // Draw table header
    pdf.setFillColor(100, 100, 100);
    pdf.rect(startX, startY, colWidths[0], rowHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DAY / TIME', startX + colWidths[0] / 2, startY + rowHeight / 2 + 2, { align: 'center' });

    let currentX = startX + colWidths[0];
    TIME_SLOTS.forEach(slot => {
      pdf.rect(currentX, startY, colWidths[1], rowHeight, 'F');
      pdf.text(slot.label, currentX + colWidths[1] / 2, startY + rowHeight / 2 + 2, { align: 'center' });
      currentX += colWidths[1];
    });

    // Draw table rows
    let currentY = startY + rowHeight;
    let isAlternateRow = false;

    DAYS.forEach(day => {
      // Alternate row background
      if (isAlternateRow) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(startX, currentY, pageWidth - margin * 2, rowHeight, 'F');
      }
      isAlternateRow = !isAlternateRow;

      // Draw day cell
      pdf.setFillColor(100, 100, 100);
      pdf.rect(startX, currentY, colWidths[0], rowHeight, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(day, startX + colWidths[0] / 2, currentY + rowHeight / 2 + 2, { align: 'center' });

      // Draw time slot cells
      currentX = startX + colWidths[0];
      TIME_SLOTS.forEach(slot => {
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(currentX, currentY, colWidths[1], rowHeight);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        
        let cellText = '';
        if (slot.type === 'break') {
          cellText = 'SHORT BREAK';
        } else {
          const subject = assignedSubjects.find(s => s.day === day && s.timeSlot === slot.label);
          if (subject) {
            cellText = `${subject.code}\n${subject.name}\n(${subject.teacher})`;
          } else {
            cellText = '---';
          }
        }
        
        // Split text into lines and center each line
        const lines = cellText.split('\n');
        const lineHeight = 3;
        const totalTextHeight = lines.length * lineHeight;
        const startTextY = currentY + (rowHeight - totalTextHeight) / 2 + lineHeight;
        
        lines.forEach((line, index) => {
          pdf.text(line, currentX + colWidths[1] / 2, startTextY + (index * lineHeight), { align: 'center' });
        });
        
        currentX += colWidths[1];
      });

      currentY += rowHeight;
    });

    // Draw outer border
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(startX, startY, pageWidth - margin * 2, currentY - startY);

    // Add footer information
    const footerY = currentY + 10;
    if (footerY < pageHeight - 20) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`TT CO-ORDINATOR: ${timetableData.coordinators.tt}`, margin, footerY);
      pdf.text(`CLASS CO-ORDINATOR: ${timetableData.coordinators.class}`, margin, footerY + 5);
      pdf.text(`HOD COMP: ${timetableData.coordinators.hod}`, margin, footerY + 10);
    }

    // Save the PDF
    pdf.save(`timetable-${timetableData.class}-${timetableData.section}.pdf`);
    toast.success('Timetable exported as PDF successfully!');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-8 h-8 mr-3 text-blue-600" />
                  Smart Timetable Generator
                </h1>
                <p className="text-gray-600">Create and manage academic timetables with drag-and-drop interface</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={generateAutoTimetable}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Generate Timetable</span>
                </button>
                <button
                  onClick={clearTimetable}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={saveTimetable}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={exportTimetable}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={exportTimetableAsPDF}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Timetable Info Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Class (e.g., BE)"
                value={timetableData.class}
                onChange={(e) => setTimetableData(prev => ({ ...prev, class: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Section"
                value={timetableData.section}
                onChange={(e) => setTimetableData(prev => ({ ...prev, section: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Department"
                value={timetableData.department}
                onChange={(e) => setTimetableData(prev => ({ ...prev, department: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Academic Year"
                value={timetableData.academicYear}
                onChange={(e) => setTimetableData(prev => ({ ...prev, academicYear: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Subject Palette */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-4 h-fit">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Subject Palette
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {subjects.map((subject, index) => (
                    <DraggableSubject key={index} subject={subject} />
                  ))}
                </div>
                
                <button
                  onClick={() => setShowAddSubjectModal(true)}
                  className="w-full mt-4 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject</span>
                </button>
              </div>
            </div>

            {/* Timetable Grid */}
            <div className="xl:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="text-lg font-semibold text-center">
                    {timetableData.department} DEPARTMENT
                  </h3>
                  <p className="text-center text-gray-600">
                    {timetableData.class} TIME TABLE (SEM-II) DIV-{timetableData.section}
                  </p>
                  <p className="text-center text-gray-600">
                    ACADEMIC YEAR {timetableData.academicYear}
                  </p>
                </div>

                {/* Timetable Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-sm font-semibold w-24">
                          DAY / TIME
                        </th>
                        {TIME_SLOTS.map((slot, index) => (
                          <th key={index} className="border border-gray-300 p-2 text-xs font-semibold min-w-32">
                            {slot.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map((day, dayIndex) => (
                        <tr key={day} className={dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 p-2 text-sm font-semibold bg-gray-100 text-center">
                            {day}
                          </td>
                          {TIME_SLOTS.map((timeSlot, slotIndex) => (
                            <td key={slotIndex} className="border border-gray-300 p-1">
                              <TimeSlotDropZone
                                day={day}
                                timeSlot={timeSlot}
                                subjects={assignedSubjects}
                                onDrop={handleDrop}
                                onRemove={handleRemoveSubject}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Info */}
                <div className="bg-gray-50 p-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p><strong>TT CO-ORDINATOR:</strong> {timetableData.coordinators.tt}</p>
                    </div>
                    <div>
                      <p><strong>CLASS CO-ORDINATOR:</strong> {timetableData.coordinators.class}</p>
                    </div>
                    <div>
                      <p><strong>HOD COMP:</strong> {timetableData.coordinators.hod}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Drag subjects from the palette on the left to the timetable slots</li>
              <li>• Use "Auto Fill" to create a complete timetable layout automatically</li>
              <li>• Click the × button on assigned subjects to remove them</li>
              <li>• Save your timetable or export it as JSON/PDF for backup</li>
              <li>• Break times are automatically handled and cannot be edited</li>
            </ul>
          </div>
        </div>

        {/* Add Subject Modal */}
        {showAddSubjectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Add New Subject</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                  <input
                    type="text"
                    value={newSubjectForm.code}
                    onChange={(e) => setNewSubjectForm({ ...newSubjectForm, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. MATH-101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    value={newSubjectForm.name}
                    onChange={(e) => setNewSubjectForm({ ...newSubjectForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                  <input
                    type="text"
                    value={newSubjectForm.teacher}
                    onChange={(e) => setNewSubjectForm({ ...newSubjectForm, teacher: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. Prof. Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                  <input
                    type="text"
                    value={newSubjectForm.room}
                    onChange={(e) => setNewSubjectForm({ ...newSubjectForm, room: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g. Room-101"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newSubjectForm.code || !newSubjectForm.name || !newSubjectForm.teacher) {
                      toast.error('Please fill in required fields (Code, Name, Teacher)');
                      return;
                    }
                    setSubjects(prev => [...prev, newSubjectForm]);
                    setShowAddSubjectModal(false);
                    setNewSubjectForm({ code: '', name: '', teacher: '', room: '' });
                    toast.success('Subject added');
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DndProvider>
  );
};

export default SmartTimetableGenerator;
