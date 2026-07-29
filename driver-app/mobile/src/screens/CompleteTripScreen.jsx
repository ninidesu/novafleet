import React, { useState } from 'react';
import { View, Modal, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius } from '../theme/tokens';
import { useAppState } from '../state/AppStateContext';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, H1, H2, Muted } from '../components/ui';
import { TextField, SelectField, Field, CheckboxRow } from '../components/FormFields';
import SegmentedControl from '../components/SegmentedControl';
import UploadSlot from '../components/UploadSlot';
import Button, { ButtonRow } from '../components/Button';
import Banner from '../components/Banner';
import Icon from '../theme/icons';

export default function CompleteTripScreen({ navigation }) {
  const { colors } = useTheme();
  const { flags, completeTrip } = useAppState();
  const [destinationReached, setDestinationReached] = useState(true);
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState('½ tank');
  const [odoPhoto, setOdoPhoto] = useState(true);
  const [fuelPurchased, setFuelPurchased] = useState('Yes');
  const [unreported, setUnreported] = useState('No');
  const [notes, setNotes] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleEndTrip = () => {
    setConfirmOpen(false);
    completeTrip({ odometer, fuelLevel, fuelPurchased, unreported, notes });
    navigation.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: 'TripSummary' }] });
  };

  return (
    <ScreenContainer>
      <H1 style={{ fontSize: 17 }}>End trip</H1>
      <CheckboxRow label="Destination reached" checked={destinationReached} onToggle={() => setDestinationReached((v) => !v)} />

      <TextField label="Odometer" value={odometer} onChangeText={setOdometer} placeholder="48,268 km" keyboardType="numeric" />
      <SelectField label="Fuel level" value={fuelLevel} onChange={setFuelLevel} options={['Full', '¾ tank', '½ tank', '¼ tank']} />
      <Field label="Odometer photo">
        <UploadSlot added={odoPhoto} onPress={() => setOdoPhoto((v) => !v)} />
      </Field>
      <Field label="Fuel purchased?">
        <SegmentedControl options={['Yes', 'No']} value={fuelPurchased} onChange={setFuelPurchased} />
      </Field>
      <Field label="Unreported incident?">
        <SegmentedControl options={['No', 'Yes']} value={unreported} onChange={setUnreported} />
      </Field>
      <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

      {flags.syncing && <Banner kind="warning" icon="refresh" text="2 records still syncing." />}

      <Button label="End trip" onPress={() => setConfirmOpen(true)} />

      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(6,12,24,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: colors.panel, borderRadius: radius.xl, padding: 20, rowGap: 12, alignItems: 'center' }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alertTriangle" size={22} color={colors.warning} />
            </View>
            <H2>End this trip?</H2>
            <Muted>Tracking will stop.</Muted>
            <ButtonRow>
              <Button label="Cancel" variant="secondary" onPress={() => setConfirmOpen(false)} style={{ flex: 1 }} />
              <Button label="End trip" onPress={handleEndTrip} style={{ flex: 1 }} />
            </ButtonRow>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
