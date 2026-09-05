import { View } from "react-native";
import { COURSE, NINES, TEES, TEE_LABEL, otherNine } from "@shared/course.ts";
import type { Format, Nine, Tee } from "@shared/types.ts";
import { Chip, Label, Row } from "./ui.tsx";

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
    <View>
      <Label>Holes</Label>
      <Row>
        <Chip flex on={value.format === 9} onPress={() => setFormat(9)}>
          Nine
        </Chip>
        <Chip flex on={value.format === 18} onPress={() => setFormat(18)}>
          Eighteen
        </Chip>
      </Row>
      {value.format === 9 ? (
        <View>
          <Label>Nine</Label>
          <Row>
            {NINES.map((n) => (
              <Chip key={n} flex on={front === n} onPress={() => setFront(n)}>
                {COURSE[n].label}
              </Chip>
            ))}
          </Row>
        </View>
      ) : (
        <View>
          <Label>Front</Label>
          <Row>
            {NINES.map((n) => (
              <Chip key={n} flex on={front === n} onPress={() => setFront(n)}>
                {COURSE[n].label}
              </Chip>
            ))}
          </Row>
          <Label>Back</Label>
          <Row>
            {NINES.map((n) => (
              <Chip key={n} flex on={back === n} onPress={() => setBack(n)}>
                {COURSE[n].label}
              </Chip>
            ))}
          </Row>
        </View>
      )}
      <Label>Tee</Label>
      <Row wrap>
        {TEES.map((t) => (
          <Chip key={t} on={value.tee === t} onPress={() => onChange({ ...value, tee: t })}>
            {TEE_LABEL[t]}
          </Chip>
        ))}
      </Row>
    </View>
  );
}
