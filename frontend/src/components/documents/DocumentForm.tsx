import { useEffect, useMemo, useState } from 'react';
import Button from '../common/Button';
import type { DocumentType } from '../../types/document';
import type { DocumentFormOptions } from '../../types/formOptions';

interface Props {
  initialType?: DocumentType | '';
  isTypeLocked?: boolean;
  initialProgramCode?: string;
  isProgramLocked?: boolean;
  onCancel?: () => void;
  options: DocumentFormOptions;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: {
    type: DocumentType;
    programCode: string;
    familyId: number;
    responsibleEngineerId: number;
    modelYear: string;
    phase: string;
    carLeader?: string;
    changeDescription?: string;
    associatedDocument?: string;
    composite?: string;
    issue?: string;
    target?: string;
  }) => void;
}

export default function DocumentForm({
  initialType = '',
  isTypeLocked = false,
  initialProgramCode = '',
  isProgramLocked = false,
  onCancel,
  options,
  loading = false,
  error = '',
  onSubmit,
}: Props) {
  const [type, setType] = useState(initialType);
  const [programCode, setProgramCode] = useState(initialProgramCode);
  const [familyId, setFamilyId] = useState('');
  const [responsibleEngineerId, setResponsibleEngineerId] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [phase, setPhase] = useState('');
  const [carLeader, setCarLeader] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [associatedDocument, setAssociatedDocument] = useState('');
  const [composite, setComposite] = useState('');
  const [issue, setIssue] = useState('');
  const [target, setTarget] = useState('');
  const [errors, setErrors] = useState({
    type: '',
    programCode: '',
    familyId: '',
    responsibleEngineerId: '',
    modelYear: '',
    phase: '',
    carLeader: '',
    changeDescription: '',
    associatedDocument: '',
    composite: '',
    issue: '',
    target: '',
  });

  const filteredFamilies = useMemo(
    () =>
      options.families.filter((family) => family.programCode === programCode),
    [options.families, programCode],
  );

  const filteredResponsibleEngineers = useMemo(
    () =>
      options.responsibleEngineers.filter(
        (engineer) => engineer.programCode === programCode,
      ),
    [options.responsibleEngineers, programCode],
  );

  const isFormValid =
    type &&
    programCode &&
    familyId &&
    responsibleEngineerId &&
    modelYear &&
    phase;

  useEffect(() => {
    if (!initialProgramCode) {
      return;
    }

    setProgramCode(initialProgramCode);
    setFamilyId('');
    setResponsibleEngineerId('');
  }, [initialProgramCode]);

  function handleProgramChange(nextProgramCode: string) {
    setProgramCode(nextProgramCode);
    setFamilyId('');
    setResponsibleEngineerId('');
  }

  function validate() {
    const newErrors = {
      type: '',
      programCode: '',
      familyId: '',
      responsibleEngineerId: '',
      modelYear: '',
      phase: '',
      carLeader: '',
      changeDescription: '',
      associatedDocument: '',
      composite: '',
      issue: '',
      target: '',
    };

    if (!type) newErrors.type = 'Document type is required';
    if (!programCode) newErrors.programCode = 'Program is required';
    if (!familyId) newErrors.familyId = 'Family is required';
    if (!responsibleEngineerId) {
      newErrors.responsibleEngineerId = 'Responsible engineer is required';
    }
    if (!modelYear) newErrors.modelYear = 'Model year is required';
    if (!phase) newErrors.phase = 'Phase is required';

    if (type === 'BCN' || type === 'DCN') {
      if (!carLeader.trim()) {
        newErrors.carLeader = 'Car leader is required';
      }

      if (!changeDescription.trim()) {
        newErrors.changeDescription = 'Change description is required';
      }
    }

    if (type === 'DFM') {
      if (!composite.trim()) {
        newErrors.composite = 'Composite is required';
      }

      if (!issue.trim()) {
        newErrors.issue = 'Issue is required';
      }

      if (!target.trim()) {
        newErrors.target = 'Target is required';
      }
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some((fieldError) => fieldError !== '');
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validate()) return;

    onSubmit?.({
      type: type as DocumentType,
      programCode,
      familyId: Number(familyId),
      responsibleEngineerId: Number(responsibleEngineerId),
      modelYear,
      phase,
      carLeader: carLeader || undefined,
      changeDescription: changeDescription || undefined,
      associatedDocument: associatedDocument || undefined,
      composite: composite || undefined,
      issue: issue || undefined,
      target: target || undefined,
    });
  }

  return (
    <form className="document-form" onSubmit={handleSubmit}>
      {loading && <span className="form-hint">Loading form options...</span>}
      {error && (
        <span className="form-error">Unable to load options: {error}</span>
      )}

      <div className="form-field">
        <label>Document Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as DocumentType | '')}
          disabled={isTypeLocked || loading}
        >
          <option value="">Select type</option>
          {options.documentTypes.map((documentType) => (
            <option key={documentType.code} value={documentType.code}>
              {documentType.code} - {documentType.name}
            </option>
          ))}
        </select>
      </div>
      {isTypeLocked && (
        <span className="form-hint">
          Document type is set by the current table.
        </span>
      )}
      {errors.type && <span className="form-error">{errors.type}</span>}

      <div className="form-field">
        <label>Program</label>
        <select
          value={programCode}
          onChange={(e) => handleProgramChange(e.target.value)}
          disabled={loading || isProgramLocked}
        >
          <option value="">Select program</option>
          {options.programs.map((program) => (
            <option key={program.code} value={program.code}>
              {program.code} - {program.name}
            </option>
          ))}
        </select>
      </div>
      {isProgramLocked && (
        <span className="form-hint">
          Program is set automatically from your user profile.
        </span>
      )}
      {errors.programCode && (
        <span className="form-error">{errors.programCode}</span>
      )}

      <div className="form-field">
        <label>Family</label>
        <select
          value={familyId}
          onChange={(e) => setFamilyId(e.target.value)}
          disabled={loading || !programCode}
        >
          <option value="">Select family</option>
          {filteredFamilies.map((family) => (
            <option key={family.id} value={family.id}>
              {family.name}
            </option>
          ))}
        </select>
      </div>
      {!programCode && (
        <span className="form-hint">
          Choose a program first to see families.
        </span>
      )}
      {errors.familyId && <span className="form-error">{errors.familyId}</span>}

      <div className="form-field">
        <label>Responsible Engineer</label>
        <select
          value={responsibleEngineerId}
          onChange={(e) => setResponsibleEngineerId(e.target.value)}
          disabled={loading || !programCode}
        >
          <option value="">Select responsible engineer</option>
          {filteredResponsibleEngineers.map((engineer) => (
            <option key={engineer.id} value={engineer.id}>
              {engineer.name}
            </option>
          ))}
        </select>
      </div>
      {!programCode && (
        <span className="form-hint">
          Choose a program first to see responsible engineers.
        </span>
      )}
      {errors.responsibleEngineerId && (
        <span className="form-error">{errors.responsibleEngineerId}</span>
      )}

      <div className="form-field">
        <label>Model Year</label>
        <input
          type="text"
          value={modelYear}
          onChange={(e) => setModelYear(e.target.value)}
          placeholder="Example: 2026"
          disabled={loading}
        />
      </div>
      {errors.modelYear && (
        <span className="form-error">{errors.modelYear}</span>
      )}

      <div className="form-field">
        <label>Phase</label>
        <input
          type="text"
          value={phase}
          onChange={(e) => setPhase(e.target.value)}
          placeholder="Example: SOP"
          disabled={loading}
        />
      </div>
      {errors.phase && <span className="form-error">{errors.phase}</span>}

      {(type === 'BCN' || type === 'DCN') && (
        <div className="form-field">
          <label>Car Leader</label>
          <input
            type="text"
            value={carLeader}
            onChange={(e) => setCarLeader(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      {errors.carLeader && (
        <span className="form-error">{errors.carLeader}</span>
      )}

      {type === 'DCN' && (
        <div className="form-field">
          <label>Associated Document</label>
          <input
            type="text"
            value={associatedDocument}
            onChange={(e) => setAssociatedDocument(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      {errors.associatedDocument && (
        <span className="form-error">{errors.associatedDocument}</span>
      )}

      {type === 'DFM' && (
        <>
          <div className="form-field">
            <label>Composite</label>
            <input
              type="text"
              value={composite}
              onChange={(e) => setComposite(e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.composite && (
            <span className="form-error">{errors.composite}</span>
          )}

          <div className="form-field">
            <label>Issue</label>
            <input
              type="text"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.issue && <span className="form-error">{errors.issue}</span>}

          <div className="form-field">
            <label>Target</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              disabled={loading}
            />
          </div>
          {errors.target && <span className="form-error">{errors.target}</span>}
        </>
      )}

      {(type === 'BCN' || type === 'DCN') && (
        <div className="form-field">
          <label>Change Description</label>
          <input
            type="text"
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            disabled={loading}
          />
        </div>
      )}
      {errors.changeDescription && (
        <span className="form-error">{errors.changeDescription}</span>
      )}

      <div className="form-actions">
        <Button
          type="submit"
          disabled={!isFormValid || loading || Boolean(error)}
        >
          Create Document
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
