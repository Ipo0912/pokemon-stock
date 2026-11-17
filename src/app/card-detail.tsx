import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function CardDetailScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  const [loading, setLoading] = useState(false);
  const [estimation, setEstimation] = useState<string | null>(null);

  const handleRevaluer = async () => {
    if (!uri) return;
    setLoading(true);
    setEstimation(null);

    try {
      // 🔴 REMPLACE "192.168.X.X" PAR TON ADRESSE IPv4 RÉELLE 🔴
      const API_URL = "http://192.168.1.30:3000/api/scan";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUri: uri }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la communication avec le PC.",
        );
      }

      setEstimation(data.estimation || "Carte évaluée avec succès !");
    } catch (error: any) {
      Alert.alert(
        "Erreur de connexion",
        error.message || "Impossible de joindre le site web local.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détails de la Carte</Text>

      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      ) : (
        <Text style={styles.errorText}>Aucune image trouvée.</Text>
      )}

      {estimation && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Résultat de l'IA :</Text>
          <Text style={styles.resultText}>{estimation}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleRevaluer}>
          <Text style={styles.buttonText}>Évaluer avec l'IA</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, styles.backButton]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 40,
  },
  image: {
    width: "100%",
    height: 400,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 20,
  },
  resultContainer: {
    backgroundColor: "#e8f4f8",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#b6d4fe",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#084298",
  },
  resultText: {
    fontSize: 16,
    color: "#052c65",
  },
});
