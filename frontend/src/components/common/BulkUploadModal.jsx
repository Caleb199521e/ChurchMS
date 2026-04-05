import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import Modal from './Modal';
import { toast } from './Toaster';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import api from '../../utils/api';

export default function BulkUploadModal({ isOpen, onClose, onSubmit, departments }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(1); // 1: upload, 2: preview/validate
  const [uploading, setUploading] = useState(false);

  const VALID_ROLES = ['member', 'deacon', 'elder', 'pastor', 'leader', 'worker'];
  const VALID_GENDERS = ['male', 'female', 'other'];
  const deptMap = Object.fromEntries(departments.map(d => [d.name.toLowerCase(), d._id]));

  const parseFile = (file) => {
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          validateAndSetData(results.data);
        },
        error: (error) => {
          toast.error(`CSV parse error: ${error.message}`);
        },
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          validateAndSetData(jsonData);
        } catch (error) {
          toast.error(`Excel parse error: ${error.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Only CSV and Excel files are supported');
    }
  };

  const validateAndSetData = (records) => {
    const validatedData = [];
    const newErrors = [];

    records.forEach((row, idx) => {
      const rowNum = idx + 2; // +2 because of header and 0-indexing
      const rowErrors = [];

      // Check required field: fullName
      if (!row.fullName || !row.fullName.trim()) {
        rowErrors.push('Missing fullName');
      }

      // Validate role
      if (row.role && !VALID_ROLES.includes(row.role.toLowerCase())) {
        rowErrors.push(`Invalid role: ${row.role}`);
      }

      // Validate gender
      if (row.gender && !VALID_GENDERS.includes(row.gender.toLowerCase())) {
        rowErrors.push(`Invalid gender: ${row.gender}`);
      }

      // Validate department exists
      let deptId = null;
      if (row.department) {
        deptId = deptMap[row.department.toLowerCase()];
        if (!deptId) {
          rowErrors.push(`Department not found: ${row.department}`);
        }
      }

      if (rowErrors.length > 0) {
        newErrors.push({ row: rowNum, errors: rowErrors });
      } else {
        validatedData.push({
          ...row,
          role: row.role?.toLowerCase() || 'member',
          gender: row.gender?.toLowerCase() || '',
          department: deptId || null,
          joinDate: row.joinDate || new Date().toISOString().split('T')[0],
        });
      }
    });

    setData(validatedData);
    setErrors(newErrors);
    setStep(2);

    if (newErrors.length === 0 && validatedData.length > 0) {
      toast.success(`Valid records: ${validatedData.length}`);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setData([]);
      setErrors([]);
      parseFile(file);
    }
  };

  const handleUpload = async () => {
    if (data.length === 0) {
      toast.error('No valid records to upload');
      return;
    }

    setUploading(true);
    try {
      await onSubmit(data);
      toast.success(`Successfully uploaded ${data.length} members`);
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setData([]);
    setErrors([]);
    setStep(1);
    onClose();
  };

  const downloadTemplate = () => {
    try {
      // Direct download URL
      const downloadUrl = '/api/members/template/download';
      
      // Create link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'members_template.csv';
      link.setAttribute('type', 'hidden');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Template download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Upload Members" size="lg">
      {step === 1 ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              <strong>Supported formats:</strong> CSV or Excel (.xlsx, .xls)
            </p>
            <p className="text-sm text-gray-600 mb-3">
              <strong>Required column:</strong> fullName
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Optional columns:</strong> phone, email, gender (male/female/other), role (member/deacon/elder/pastor/leader/worker), department, address, joinDate (YYYY-MM-DD), notes
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              📥 Download Sample Template
            </button>
          </div>

          <label className="flex items-center justify-center border-2 border-dashed border-blue-300 rounded-lg p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-center">
              <CloudUploadIcon sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Click to select or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">CSV or Excel format</p>
            </div>
          </label>

          <div className="flex gap-3">
            <button onClick={handleClose} className="btn-outline flex-1">Cancel</button>
            <button
              onClick={() => setStep(2)}
              disabled={data.length === 0}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review & Upload
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-2">
                <ErrorIcon sx={{ fontSize: 20, color: '#ef4444' }} />
                <div>
                  <p className="font-semibold text-red-900 text-sm">Validation Errors ({errors.length} rows)</p>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-800">
                        <strong>Row {err.row}:</strong> {err.errors.join(', ')}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {data.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircleIcon sx={{ fontSize: 20, color: '#10b981' }} />
                <div>
                  <p className="font-semibold text-green-900 text-sm">Valid Records: {data.length}</p>
                  <div className="mt-3 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {data.slice(0, 10).map((member, i) => (
                        <div key={i} className="text-xs text-green-800 p-2 bg-white rounded border border-green-100">
                          <p className="font-medium">{member.fullName}</p>
                          {member.phone && <p className="text-gray-600">{member.phone}</p>}
                          {member.email && <p className="text-gray-600">{member.email}</p>}
                        </div>
                      ))}
                    </div>
                    {data.length > 10 && (
                      <p className="text-xs text-green-700 mt-2 pt-2 border-t border-green-200">
                        ... and {data.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn-outline flex-1"
            >
              Back
            </button>
            <button
              onClick={handleUpload}
              disabled={data.length === 0 || uploading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : `Upload ${data.length} Members`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
