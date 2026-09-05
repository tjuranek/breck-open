import { motion } from "motion/react";
import { tap, tapSpring } from "./anim.tsx";
import { COURSE, NINES, TEES, TEE_LABEL, otherNine } from "./shared/course.ts";
import type { Format, Nine, Tee } from "./shared/types.ts";

export type SetupValue = {
  format: Format;
  nines: Nine[];
  tee: Tee;
};

export function SetupFields({
  value,
  onChange,
}: {
  value: SetupValue;
  onChange: (next: SetupValue) => void;
}) {
  const front = value.nines[0] ?? "bear";
  const back = value.nines[1] ?? otherNine(front);

  function setFormat(format: Format) {
    onChange({
      ...value,
      format,
      nines: format === 9 ? [front] : [front, front === back ? otherNine(front) : back],
    });
  }

  function setFront(nine: Nine) {
    if (value.format === 9) {
      onChange({ ...value, nines: [nine] });
      return;
    }
    onChange({ ...value, nines: [nine, nine === back ? otherNine(nine) : back] });
  }

  function setBack(nine: Nine) {
    onChange({ ...value, nines: [front === nine ? otherNine(nine) : front, nine] });
  }

  return (
    <>
      <label>Holes</label>
      <div className="picks">
        <motion.button
          type="button"
          className={`toggle ${value.format === 9 ? "on" : ""}`}
          whileTap={tap}
          transition={tapSpring}
          onClick={() => setFormat(9)}
        >
          Nine
        </motion.button>
        <motion.button
          type="button"
          className={`toggle ${value.format === 18 ? "on" : ""}`}
          whileTap={tap}
          transition={tapSpring}
          onClick={() => setFormat(18)}
        >
          Eighteen
        </motion.button>
      </div>
      {value.format === 9 ? (
        <div>
          <label htmlFor="nine">Nine</label>
          <select id="nine" value={front} onChange={(e) => setFront(e.target.value as Nine)}>
            {NINES.map((n) => (
              <option key={n} value={n}>
                {COURSE[n].label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="row">
          <div>
            <label htmlFor="front">Front</label>
            <select id="front" value={front} onChange={(e) => setFront(e.target.value as Nine)}>
              {NINES.map((n) => (
                <option key={n} value={n}>
                  {COURSE[n].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="back">Back</label>
            <select id="back" value={back} onChange={(e) => setBack(e.target.value as Nine)}>
              {NINES.map((n) => (
                <option key={n} value={n}>
                  {COURSE[n].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <label htmlFor="tee">Tee</label>
      <select
        id="tee"
        value={value.tee}
        onChange={(e) => onChange({ ...value, tee: e.target.value as Tee })}
      >
        {TEES.map((t) => (
          <option key={t} value={t}>
            {TEE_LABEL[t]}
          </option>
        ))}
      </select>
    </>
  );
}
