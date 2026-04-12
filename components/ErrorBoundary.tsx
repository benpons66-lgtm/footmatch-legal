import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Attrape toutes les erreurs React non gérées.
 * Sans ça, un crash silencieux plante toute l'app (rejetté par l'App Store).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // En production, envoyer à un service de monitoring (ex: Sentry)
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container} accessible accessibilityLabel="Écran d'erreur">
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.emoji} accessibilityRole="image" accessibilityLabel="Erreur">
              ⚽
            </Text>
            <Text style={styles.title} accessibilityRole="header">
              Oups, quelque chose s'est cassé
            </Text>
            <Text style={styles.subtitle}>
              Une erreur inattendue s'est produite. Tes données sont en sécurité.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.devError}>
                <Text style={styles.devErrorTitle}>Détails (DEV uniquement)</Text>
                <Text style={styles.devErrorText} selectable>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.btn}
              onPress={this.handleReset}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Réessayer"
            >
              <Text style={styles.btnText}>Réessayer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    backgroundColor: Colors.green,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  btnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devError: {
    backgroundColor: Colors.bg3,
    borderRadius: 8,
    padding: Spacing.md,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
    marginTop: 8,
  },
  devErrorTitle: {
    color: '#FF6B6B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  devErrorText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
