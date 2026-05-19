// components/Copyright.tsx — FootMatch
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export default function Copyright() {
  return (
    <Text style={s.text}>© 2026 FootMatch™. Tous droits réservés.</Text>
  );
}

const s = StyleSheet.create({
  text: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});
