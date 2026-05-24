import { useMemo, useState } from 'react';
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
  submitLabel?: string;
  showReassignmentReason?: boolean;
  initialResponsibleEngineerId?: number;
  className?: string;
  formId?: string;
  showFormActions?: boolean;
  hideLockedFields?: boolean;
  initialValues?: {
    familyId?: number;
    responsibleEngineerId?: number;
    modelYear?: string;
    phase?: string;
    carLeaderId?: number;
    changeDescription?: string;
    associatedDocument?: string;
    composite?: string;
    issue?: string;
    dreId?: number;
    reassignmentReason?: string;
  };
  onSubmit?: (values: {
    type: DocumentType;
    programCode: string;
    familyId: number;
    responsibleEngineerId: number;
    modelYear: string;
    phase: string;
    carLeaderId?: number;
    changeDescription?: string;
    associatedDocument?: string;
    composite?: string;
    issue?: string;
    dreId?: number;
    reassignmentReason?: string;
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
  submitLabel = 'Create Document',
  showReassignmentReason = false,
  initialResponsibleEngineerId,
  className = '',
  formId,
  showFormActions = true,
  hideLockedFields = false,
  initialValues,
  onSubmit,
}: Props) {
  const [type, setType] = useState(initialType);
  const [programCode, setProgramCode] = useState(initialProgramCode);
  const [familyId, setFamilyId] = useState(() =>
    initialValues?.familyId ? String(initialValues.familyId) : '',
  );
  const [responsibleEngineerId, setResponsibleEngineerId] = useState(() =>
    initialValues?.responsibleEngineerId
      ? String(initialValues.responsibleEngineerId)
      : '',
  );
  const [modelYear, setModelYear] = useState(initialValues?.modelYear ?? '');
  const [phase, setPhase] = useState(initialValues?.phase ?? '');
  const [changeDescription, setChangeDescription] = useState(
    initialValues?.changeDescription ?? '',
  );
  const [associatedDocument, setAssociatedDocument] = useState(
    initialValues?.associatedDocument ?? '',
  );
  const [composite, setComposite] = useState(initialValues?.composite ?? '');
  const [issue, setIssue] = useState(initialValues?.issue ?? '');
  const [dreId, setDreId] = useState(() =>
    initialValues?.dreId ? String(initialValues.dreId) : '',
  );
  const [reassignmentReason, setReassignmentReason] = useState(
    initialValues?.reassignmentReason ?? '',
  );
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
    dreId: '',
    reassignmentReason: '',
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

  const filteredCarLeaders = useMemo(
    () =>
      options.carLeaders.filter(
        (carLeader) => carLeader.programCode === programCode,
      ),
    [options.carLeaders, programCode],
  );

  const selectedCarLeader = filteredCarLeaders[0] ?? null;
  const hasSingleCarLeader = filteredCarLeaders.length === 1;

  const filteredDres = useMemo(
    () => options.dres.filter((dre) => dre.programCode === programCode),
    [options.dres, programCode],
  );

  const isFormValid =
    type &&
    programCode &&
    familyId &&
    responsibleEngineerId &&
    modelYear &&
    phase;

  function handleProgramChange(nextProgramCode: string) {
    setProgramCode(nextProgramCode);
    setFamilyId('');
    setResponsibleEngineerId('');
    setDreId('');
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
      dreId: '',
      reassignmentReason: '',
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
      if (!selectedCarLeader) {
        newErrors.carLeader = 'Car leader is required for the selected program';
      } else if (!hasSingleCarLeader) {
        newErrors.carLeader =
          'The selected program must have exactly one car leader';
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

      if (!dreId) {
        newErrors.dreId = 'DRE is required';
      }
    }

    const isReassigningResponsible =
      Boolean(initialResponsibleEngineerId) &&
      Number(responsibleEngineerId) !== initialResponsibleEngineerId;

    if (
      showReassignmentReason &&
      isReassigningResponsible &&
      !reassignmentReason.trim()
    ) {
      newErrors.reassignmentReason =
        'Reassignment reason is required when changing responsible engineer';
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
      carLeaderId: selectedCarLeader?.id,
      changeDescription: changeDescription || undefined,
      associatedDocument: associatedDocument || undefined,
      composite: composite || undefined,
      issue: issue || undefined,
      dreId: dreId ? Number(dreId) : undefined,
      reassignmentReason: reassignmentReason || undefined,
    });
  }

  return (
    <form
      id={formId}
      className={`document-form ${className}`.trim()}
      onSubmit={handleSubmit}
    >
      {loading && <span className="form-hint">Loading form options...</span>}
      {error && (
        <span className="form-error">Unable to load options: {error}</span>
      )}

      {!(hideLockedFields && isTypeLocked) && (
        <>
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
        </>
      )}

      {!(hideLockedFields && isProgramLocked) && (
        <>
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
        </>
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
            value={selectedCarLeader?.name ?? ''}
            readOnly
            disabled={loading || !programCode}
            placeholder="Assigned automatically from program"
          />
        </div>
      )}
      {(type === 'BCN' || type === 'DCN') && !programCode && (
        <span className="form-hint">
          Choose a program first to see the assigned car leader.
        </span>
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
            <label>DRE</label>
            <select
              value={dreId}
              onChange={(e) => setDreId(e.target.value)}
              disabled={loading || !programCode}
            >
              <option value="">Select DRE</option>
              {filteredDres.map((dre) => (
                <option key={dre.id} value={dre.id}>
                  {dre.name}
                </option>
              ))}
            </select>
          </div>
          {!programCode && (
            <span className="form-hint">Choose a program first to see DREs.</span>
          )}
          {errors.dreId && <span className="form-error">{errors.dreId}</span>}
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

      {showReassignmentReason && (
        <div className="form-field">
          <label>Reassignment Reason</label>
          <input
            type="text"
            value={reassignmentReason}
            onChange={(e) => setReassignmentReason(e.target.value)}
            placeholder="Required only when changing responsible engineer"
            disabled={loading}
          />
        </div>
      )}
      {errors.reassignmentReason && (
        <span className="form-error">{errors.reassignmentReason}</span>
      )}

      {showFormActions && (
        <div className="form-actions">
          <Button
            type="submit"
            disabled={!isFormValid || loading || Boolean(error)}
          >
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
