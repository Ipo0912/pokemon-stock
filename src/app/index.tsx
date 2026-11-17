import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    // Vérifie si une session Supabase existe déjà
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // Si connecté, direction les onglets (Scanner / Collection / Boutiques)
      router.replace("/(tabs)");
    } else {
      // Sinon, direction la page de connexion
      router.replace("/login");
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#d9480f" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});
