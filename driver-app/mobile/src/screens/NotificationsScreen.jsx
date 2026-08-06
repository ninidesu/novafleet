import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import ScreenContainer from '../components/ScreenContainer';
import { Row, Card, H1, BodyText, Muted, IconBox, EmptyState } from '../components/ui';
import Button from '../components/Button';
import Icon from '../theme/icons';
import { useAppState } from '../state/AppStateContext';
import { driverApi } from '../services/api';

function relativeTime(iso) {
  if (!iso) return '';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notificationsRead, markNotificationsRead, showToast } = useAppState();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    driverApi
      .notifications()
      .then((data) => { if (active) { setItems(data || []); setError(''); } })
      .catch((e) => { if (active) setError(e.message || 'Unable to load notifications.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <ScreenContainer>
      <Row>
        <H1 style={{ fontSize: 17 }}>Notifications</H1>
        <Button
          label={notificationsRead ? 'All read' : 'Mark all read'}
          variant="ghost"
          size="sm"
          disabled={notificationsRead || items.length === 0}
          onPress={() => {
            markNotificationsRead();
            showToast('success', 'checkCircle', 'Notifications marked read.');
          }}
          style={{ backgroundColor: 'transparent', paddingHorizontal: 8 }}
        />
      </Row>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 30 }} />
      ) : error ? (
        <EmptyState icon={<Icon name="alertTriangle" size={20} color={colors.muted} />} title={error} />
      ) : items.length === 0 ? (
        <EmptyState icon={<Icon name="bell" size={20} color={colors.muted} />} title="No notifications yet." />
      ) : (
        <Card padding="sm" style={{ rowGap: 12 }}>
          {items.map((n) => {
            const unread = !n.acknowledged && !notificationsRead;
            return (
              <Row key={n.id}>
                <IconBox bg={unread ? colors.warningBg : colors.accentDim}>
                  <Icon name={unread ? 'alertTriangle' : 'checkCircle'} size={16} color={unread ? colors.warning : colors.accent} />
                </IconBox>
                <View style={{ flex: 1 }}>
                  <BodyText bold size={12.5}>{n.title}</BodyText>
                  <Muted>{relativeTime(n.timestamp)}</Muted>
                </View>
                {unread ? (
                  <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: colors.accent }} />
                ) : (
                  <Muted size={11}>{n.acknowledged ? 'Acknowledged' : ''}</Muted>
                )}
              </Row>
            );
          })}
        </Card>
      )}
    </ScreenContainer>
  );
}
