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

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const [id, setId] = useState('DRV-1042');
  const [password, setPassword] = useState('novafleet');
  const [remember, setRemember] = useState(true);
  const [errorState, setErrorState] = useState(null); // null | 'invalid' | 'locked'
  const [attempts, setAttempts] = useState(0);

  const handleSignIn = () => {
    // Simulated auth — a real check would call the API / Supabase here.
    if (!id.trim() || !password.trim()) {
      setErrorState('invalid');
      return;
    }
    setErrorState(null);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  const simulateInvalid = () => {
    const next = attempts + 1;
    setAttempts(next);
    setErrorState(next >= 3 ? 'locked' : 'invalid');
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

      {errorState === 'locked' ? (
        <Banner kind="danger" icon="lock" text="Too many attempts. Try again in 5 minutes." />
      ) : errorState === 'invalid' ? (
        <Banner kind="danger" icon="xCircle" text="Incorrect login. 2 attempts left." />
      ) : null}

      <TextField label="Employee ID or email" value={id} onChangeText={setId} placeholder="DRV-1042" />
      <TextField label="Password" value={password} onChangeText={setPassword} secure placeholder="Password" />
      <CheckboxRow label="Remember device" checked={remember} onToggle={() => setRemember((r) => !r)} />

      <Button label="Sign in" onPress={handleSignIn} />

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

      <Pressable
        onPress={simulateInvalid}
        style={{
          alignSelf: 'center',
          marginTop: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.line,
          borderStyle: 'dashed',
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 10, fontFamily: fontFamily.bodyBold }}>
          Preview: simulate failed login
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
