import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import { FUEL_RECORDS } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, H1, BodyText, Muted, StatusBadge, EmptyState } from '../components/ui';
import { TextField, SelectField, Field } from '../components/FormFields';
import SegmentedControl from '../components/SegmentedControl';
import Button, { ButtonRow } from '../components/Button';
import Banner from '../components/Banner';
import Icon from '../theme/icons';
import ExpandableRow from '../components/ExpandableRow';
import UploadSlot from '../components/UploadSlot';

export default function FuelScreen({ navigation }) {
  const { colors } = useTheme();
  const { flags, trip, submitFuel, showToast } = useAppState();
  const [tab, setTab] = useState('Record fuel');

  return (
    <ScreenContainer>
      <H1>Fuel</H1>
      <SegmentedControl options={['Record fuel', 'My records']} value={tab} onChange={setTab} />
      {tab === 'Record fuel' ? (
        <RecordFuelForm navigation={navigation} flags={flags} trip={trip} submitFuel={submitFuel} showToast={showToast} colors={colors} />
      ) : (
        <MyRecords colors={colors} />
      )}
    </ScreenContainer>
  );
}

function RecordFuelForm({ navigation, flags, trip, submitFuel, showToast, colors }) {
  const [submitted, setSubmitted] = useState(false);
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('32.5');
  const [pricePerLiter] = useState(194);
  const [station, setStation] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [fuelLevel, setFuelLevel] = useState('Full');
  const [receipt, setReceipt] = useState(true);
  const [odoPhoto, setOdoPhoto] = useState(true);
  const [pumpPhoto, setPumpPhoto] = useState(false);
  const [notes, setNotes] = useState('');

  const total = useMemo(() => {
    const l = parseFloat(liters) || 0;
    return Math.round(l * pricePerLiter);
  }, [liters, pricePerLiter]);

  if (submitted) {
    return (
      <EmptyState
        icon={<Icon name="checkCircle" size={20} color={colors.success} />}
        title="Fuel record submitted."
        action={<Button label="Back to trip" size="sm" onPress={() => navigation.navigate('Home')} />}
      />
    );
  }

  return (
    <Stack>
      <Card padding="sm">
        <Row>
          <View style={{ flex: 1 }}>
            <BodyText bold size={13}>
              {trip ? trip.ref : 'TRP-58291'} · {trip ? trip.vehicle : 'KDG 214P'}
            </BodyText>
            <Muted>Today, 11:52 · Mombasa Rd</Muted>
          </View>
          <Icon name="mapPin" size={15} color={colors.muted} />
        </Row>
      </Card>

      <Row>
        <TextField label="Odometer" value={odometer} onChangeText={setOdometer} placeholder="48,262 km" keyboardType="numeric" />
      </Row>
      <TextField label="Liters" value={liters} onChangeText={setLiters} keyboardType="numeric" />
      <Row style={{ columnGap: 10 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Price/L" value={`KES ${pricePerLiter}`} onChangeText={() => {}} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Total" value={`KES ${total.toLocaleString('en-US')}`} disabled onChangeText={() => {}} />
        </View>
      </Row>
      <TextField label="Station" value={station} onChangeText={setStation} placeholder="Shell Kitengela" />
      <TextField label="Receipt no." value={receiptNo} onChangeText={setReceiptNo} placeholder="RCT-90214" />
      <SelectField label="Fuel level" value={fuelLevel} onChange={setFuelLevel} options={['Full', '¾ tank', '½ tank', '¼ tank']} />
      <Field label="Receipt">
        <UploadSlot added={receipt} onPress={() => setReceipt((v) => !v)} addedLabel="Receipt added" />
      </Field>
      <Field label="Odometer photo">
        <UploadSlot added={odoPhoto} onPress={() => setOdoPhoto((v) => !v)} />
      </Field>
      <Field label="Pump photo">
        <UploadSlot added={pumpPhoto} onPress={() => setPumpPhoto((v) => !v)} />
      </Field>
      <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

      {flags.noInternet && <Banner kind="warning" icon="wifiOff" text="Offline. Saves locally, syncs later." />}

      <ButtonRow>
        <Button label="Save" variant="secondary" onPress={() => showToast('success', 'checkCircle', 'Fuel record saved.')} style={{ flex: 1 }} />
        <Button
          label={flags.noInternet ? 'Save offline' : 'Submit'}
          style={{ flex: 1 }}
          onPress={() => {
            submitFuel({ odometer, liters, total, station, receiptNo, fuelLevel, notes });
            setSubmitted(true);
          }}
        />
      </ButtonRow>
    </Stack>
  );
}

function MyRecords({ colors }) {
  return (
    <Stack>
      {FUEL_RECORDS.map((r, i) => (
        <ExpandableRow
          key={i}
          variant="card"
          summary={
            <Stack gap={6}>
              <Row>
                <Muted>
                  {r.date} · {r.vehicle}
                </Muted>
                <StatusBadge status={r.status} />
              </Row>
              <Row>
                <BodyText bold size={12.5}>
                  {r.liters}
                </BodyText>
                <BodyText bold size={12.5}>
                  {r.total}
                </BodyText>
              </Row>
            </Stack>
          }
          body={
            <View>
              <BodyText size={11.5} style={{ color: colors.muted }}>
                Odometer {r.odo}
              </BodyText>
              {r.status === 'Rejected' && (
                <BodyText size={11.5} style={{ color: colors.danger, marginTop: 4 }}>
                  Receipt unclear. Upload again.
                </BodyText>
              )}
            </View>
          }
        />
      ))}
    </Stack>
  );
}
