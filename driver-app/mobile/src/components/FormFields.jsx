import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily, radius, spacing } from '../theme/tokens';
import Icon from '../theme/icons';

export function Field({ label, children, style }) {
  const { colors } = useTheme();
  return (
    <View style={[{ rowGap: 5 }, style]}>
      {label ? (
        <Text style={{ color: colors.text, fontFamily: fontFamily.bodyBold, fontSize: 11.5 }}>{label}</Text>
      ) : null}
      {children}
    </View>
  );
}

export function TextField({ label, value, onChangeText, placeholder, secure, disabled, multiline, keyboardType }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(!secure);
  return (
    <Field label={label}>
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          editable={!disabled}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secure && !visible}
          style={{
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.sm,
            paddingHorizontal: 12,
            paddingVertical: multiline ? 10 : 10,
            minHeight: multiline ? 70 : 44,
            textAlignVertical: multiline ? 'top' : 'center',
            color: colors.text,
            backgroundColor: disabled ? colors.lineSoft : colors.panel,
            fontFamily: fontFamily.body,
            fontSize: 13,
            paddingRight: secure ? 38 : 12,
          }}
        />
        {secure ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', right: 10, height: 44, justifyContent: 'center' }}
          >
            <Icon name={visible ? 'eyeOff' : 'eye'} size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </Field>
  );
}

export function SelectField({ label, value, options, onChange, disabled }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Field label={label}>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityState={{ disabled: Boolean(disabled), expanded: open }}
        style={{
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.sm,
          paddingHorizontal: 12,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: disabled ? colors.lineSoft : colors.panel,
        }}
      >
        <Text style={{ color: colors.text, fontFamily: fontFamily.body, fontSize: 13 }}>{value}</Text>
        <Icon name="chevronRight" size={14} color={colors.muted} style={{ transform: [{ rotate: '90deg' }] }} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(6,12,24,0.5)', justifyContent: 'flex-end' }}
        >
          <View style={{ backgroundColor: colors.panel, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingVertical: 8, maxHeight: '60%' }}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={{ paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Text style={{ color: colors.text, fontFamily: item === value ? fontFamily.bodyBold : fontFamily.body, fontSize: 14 }}>
                    {item}
                  </Text>
                  {item === value ? <Icon name="checkCircle" size={16} color={colors.accent} /> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </Field>
  );
}

export function CheckboxRow({ label, checked, onToggle }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', columnGap: 9 }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          borderWidth: 2,
          borderColor: checked ? colors.accent : colors.line,
          backgroundColor: checked ? colors.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Icon name="checkCircle" size={12} color="#fff" /> : null}
      </View>
      <Text style={{ color: colors.text, fontFamily: fontFamily.bodySemibold, fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );
}
