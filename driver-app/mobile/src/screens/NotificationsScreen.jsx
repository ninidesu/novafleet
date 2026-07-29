import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { NOTIFICATIONS } from '../data/mockData';
import ScreenContainer from '../components/ScreenContainer';
import { Row, Card, H1, BodyText, Muted, IconBox } from '../components/ui';
import Button from '../components/Button';
import Icon from '../theme/icons';
import { useAppState } from '../state/AppStateContext';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notificationsRead, markNotificationsRead, showToast } = useAppState();
  return (
    <ScreenContainer>
      <Row>
        <H1 style={{ fontSize: 17 }}>Notifications</H1>
        <Button
          label={notificationsRead ? 'All read' : 'Mark all read'}
          variant="ghost"
          size="sm"
          disabled={notificationsRead}
          onPress={() => {
            markNotificationsRead();
            showToast('success', 'checkCircle', 'Notifications marked read.');
          }}
          style={{ backgroundColor: 'transparent', paddingHorizontal: 8 }}
        />
      </Row>
      <Card padding="sm" style={{ rowGap: 12 }}>
        {NOTIFICATIONS.map((n, i) => (
          <Row key={i}>
            <IconBox bg={colors.accentDim}>
              <Icon name={n.icon} size={16} color={colors.accent} />
            </IconBox>
            <View style={{ flex: 1 }}>
              <BodyText bold size={12.5}>
                {n.title}
              </BodyText>
              <Muted>{n.body}</Muted>
            </View>
            {n.unread && !notificationsRead ? (
              <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: colors.accent }} />
            ) : (
              <Muted size={11}>{n.time}</Muted>
            )}
          </Row>
        ))}
      </Card>
    </ScreenContainer>
  );
}
