import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius } from '../theme/tokens';
import Icon from '../theme/icons';
import ScreenContainer from '../components/ScreenContainer';
import { H1, Muted, Divider } from '../components/ui';
import { TextField, CheckboxRow } from '../components/FormFields';
import Button from '../components/Button';
import Banner from '../components/Banner';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    if (!id.trim() || !password.trim()) {
      setErrorMessage('Enter your email and password.');
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      // On success the auth session changes and the navigator swaps to the app.
      await signIn(id, password);
    } catch (error) {
      setErrorMessage(error.message || 'Incorrect email or password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          backgroundColor: colors.navy,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="truck" size={22} color="#fff" />
      </View>
      <View>
        <H1>Welcome back</H1>
        <Muted>Sign in to continue.</Muted>
      </View>

      {errorMessage ? <Banner kind="danger" icon="xCircle" text={errorMessage} /> : null}

      <TextField label="Email" value={id} onChangeText={setId} placeholder="you@example.com" />
      <TextField label="Password" value={password} onChangeText={setPassword} secure placeholder="Password" />
      <CheckboxRow label="Remember device" checked={remember} onToggle={() => setRemember((r) => !r)} />

      <Button label={busy ? 'Signing in…' : 'Sign in'} onPress={handleSignIn} disabled={busy} />

      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Pressable>
          <Text style={{ color: colors.accent, fontFamily: fontFamily.bodyBold, fontSize: 12.5 }}>Forgot password?</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => navigation.navigate('Setup')} style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontFamily: fontFamily.body, fontSize: 11.5 }}>
          First time signing in? <Text style={{ color: colors.accent, fontFamily: fontFamily.bodyBold }}>Complete setup</Text>
        </Text>
      </Pressable>

      <Divider />
      <Muted style={{ textAlign: 'center' }}>Need access? Contact your administrator.</Muted>
    </ScreenContainer>
  );
}
