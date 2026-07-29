import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Card, H1 } from '../components/ui';
import { TextField, SelectField } from '../components/FormFields';
import ChecklistItem from '../components/ChecklistItem';
import UploadSlot from '../components/UploadSlot';
import Button from '../components/Button';
import Banner from '../components/Banner';

export default function PretripChecklistScreen({ navigation }) {
  const { flags } = useAppState();
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('¾ tank');
  const [odoPhoto, setOdoPhoto] = useState(true);
  const [vehiclePhoto, setVehiclePhoto] = useState(false);
  const [notes, setNotes] = useState('');

  const items = [
    { label: 'Correct vehicle', checked: true },
    { label: 'Vehicle safe', checked: true },
    { label: 'Documents ready', checked: true },
    { label: 'GPS on', checked: !flags.gpsDisabled },
    { label: 'Battery sufficient', checked: !flags.lowBattery },
    { label: 'Tracker online', checked: !flags.iotOffline },
    { label: 'Enough fuel', checked: true },
  ];
  const allChecked = items.every((i) => i.checked);

  return (
    <ScreenContainer>
      <H1 style={{ fontSize: 17 }}>Checklist</H1>
      <Card padding="sm">
        <Stack gap={0}>
          {items.map((item, i) => (
            <ChecklistItem key={item.label} label={item.label} checked={item.checked} last={i === items.length - 1} />
          ))}
        </Stack>
      </Card>

      <TextField label="Odometer" value={odometer} onChangeText={setOdometer} placeholder="48,210 km" keyboardType="numeric" />
      <SelectField label="Fuel level" value={fuelLevel} onChange={setFuelLevel} options={['Full', '¾ tank', '½ tank', '¼ tank']} />
      <UploadSlot added={odoPhoto} onPress={() => setOdoPhoto((v) => !v)} />
      <UploadSlot added={vehiclePhoto} onPress={() => setVehiclePhoto((v) => !v)} addedLabel="Vehicle photo added" emptyLabel="Vehicle photo" />
      <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

      {!allChecked && <Banner kind="warning" icon="alertTriangle" text="Complete missing items." />}

      <Button label="Continue" disabled={!allChecked} onPress={() => navigation.navigate('Tracking')} />
    </ScreenContainer>
  );
}
