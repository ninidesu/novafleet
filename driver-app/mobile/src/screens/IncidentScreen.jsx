import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { useAppState } from '../state/AppStateContext';
import { INCIDENT_TYPES } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Stack, Row, Card, BodyText, Muted, EmptyState } from '../components/ui';
import { TextField, SelectField, Field, CheckboxRow } from '../components/FormFields';
import SegmentedControl from '../components/SegmentedControl';
import UploadSlot from '../components/UploadSlot';
import Button from '../components/Button';
import Banner from '../components/Banner';
import Icon from '../theme/icons';

export default function IncidentScreen({ navigation }) {
  const { colors } = useTheme();
  const { flags, submitIncident } = useAppState();
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState(INCIDENT_TYPES[0]);
  const [severity, setSeverity] = useState('Low');
  const [description, setDescription] = useState('');
  const [help, setHelp] = useState('');
  const [photos, setPhotos] = useState(false);
  const [callAdmin, setCallAdmin] = useState(false);

  if (submitted) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={<Icon name="checkCircle" size={20} color={colors.success} />}
          title="Incident sent."
          action={<Button label="Back to trip" size="sm" onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })} />}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SelectField label="Type" value={type} onChange={setType} options={INCIDENT_TYPES} />
      <Field label="Severity">
        <SegmentedControl options={['Low', 'Medium', 'High']} value={severity} onChange={setSeverity} />
      </Field>
      <TextField label="What happened?" value={description} onChangeText={setDescription} placeholder="Describe briefly" multiline />
      <TextField label="Help needed" value={help} onChangeText={setHelp} placeholder="e.g. Tow truck, spare tire" />

      <Card padding="sm" style={{ rowGap: 8 }}>
        <Row>
          <Muted>Location</Muted>
          <BodyText size={12} bold>
            Mombasa Rd (auto)
          </BodyText>
        </Row>
        <Row>
          <Muted>Time</Muted>
          <BodyText size={12} bold>
            Today, 11:58 (auto)
          </BodyText>
        </Row>
      </Card>

      <Field label="Photos">
        <UploadSlot added={photos} onPress={() => setPhotos((v) => !v)} addedLabel="Photos added" emptyLabel="Add up to 3" />
      </Field>

      <CheckboxRow label="Call administrator" checked={callAdmin} onToggle={() => setCallAdmin((v) => !v)} />

      {flags.noInternet && <Banner kind="warning" icon="wifiOff" text="Saved offline. Sends later." />}

      <Button
        label="Send report"
        variant="danger"
        onPress={() => {
          submitIncident({ type, severity, description, help });
          setSubmitted(true);
        }}
      />
    </ScreenContainer>
  );
}
