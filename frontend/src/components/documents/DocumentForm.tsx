import { useState } from 'react';
import Button from '../common/Button';

export default function DocumentForm() {
  const [type, setType] = useState('');
  const [program, setProgram] = useState('');
  const [family, setFamily] = useState('');
  const [responsible, setResponsible] = useState('');
  const [errors, setErrors] = useState({
    type: '',
    program: '',
    family: '',
    responsible: '',
  });

  const isFormValid = type && program && family && responsible;

  function validate() {
    const newErrors = {
      type: '',
      program: '',
      family: '',
      responsible: '',
    };

    if (!type) newErrors.type = 'Document type is required';
    if (!program) newErrors.program = 'Program is required';
    if (!family) newErrors.family = 'Family is required';
    if (!responsible) newErrors.responsible = 'Responsible is required';

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== '');
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    const isValid = validate();

    if (!isValid) return;

    console.log({
      type,
      program,
      family,
      responsible,
    });
  }

  return (
    <form className="document-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label>Document Type</label>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Select type</option>
          <option value="BCN">BCN</option>
          <option value="DCN">DCN</option>
          <option value="DFM">DFM</option>
        </select>
      </div>
      {errors.type && <span className="form-error">{errors.type}</span>}

      <div className="form-field">
        <label>Program</label>

        <select value={program} onChange={(e) => setProgram(e.target.value)}>
          <option value="">Select program</option>
          <option value="Y2XX">Y2XX</option>
          <option value="31XX">31XX</option>
        </select>
      </div>
      {errors.program && <span className="form-error">{errors.program}</span>}

      <div className="form-field">
        <label>Family</label>

        <select value={family} onChange={(e) => setFamily(e.target.value)}>
          <option value="">Select family</option>
          <option value="ENGINE">ENGINE</option>
          <option value="BODY">BODY</option>
          <option value="IP">IP</option>
        </select>
      </div>
      {errors.family && <span className="form-error">{errors.family}</span>}

      <div className="form-field">
        <label>Responsible</label>

        <input
          type="text"
          value={responsible}
          onChange={(e) => setResponsible(e.target.value)}
        />
      </div>
      {errors.responsible && (
        <span className="form-error">{errors.responsible}</span>
      )}

      <div className="form-actions">
        <Button disabled={!isFormValid}>Create Document</Button>
      </div>
    </form>
  );
}
