import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CardItem {
  id: string;
  image_uri: string;
  created_at: string;
}

export default function GalerieScreen() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadCardsFromSupabase();
    }, []),
  );

  const loadCardsFromSupabase = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer les cartes de l'utilisateur connecté
      const { data, error } = await supabase
        .from("cartes") // 🔴 MODIFIÉ ICI
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setCards(data);
    } catch (error) {
      console.error("Erreur chargement collection:", error);
    }
  };

  const deleteCard = async (id: string) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous retirer cette carte de la collection ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            // Supprimer de Supabase
            const { error } = await supabase
              .from("cartes") // 🔴 MODIFIÉ ICI
              .delete()
              .eq("id", id);
            if (error) {
              Alert.alert("Erreur", "Impossible de supprimer la carte.");
              return;
            }
            // Mettre à jour l'affichage local
            setCards(cards.filter((c) => c.id !== id));
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ma Collection ({cards.length})</Text>

      {cards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={64} color="#adb5bd" />
          <Text style={styles.emptyText}>
            Aucune carte pour l'instant. Scanne-en une !
          </Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardContainer}
              onPress={() =>
                router.push({
                  pathname: "/card-detail",
                  params: { uri: item.image_uri },
                })
              }
            >
              <Image
                source={{ uri: item.image_uri }}
                style={styles.cardImage}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteCard(item.id);
                }}
              >
                <Ionicons name="trash" size={18} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 15,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 20,
    textAlign: "center",
  },
  list: { justifyContent: "center" },
  cardContainer: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: { width: 140, height: 190, borderRadius: 8, resizeMode: "cover" },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#e03131",
    padding: 6,
    borderRadius: 20,
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6c757d", marginTop: 10, fontSize: 16 },
});
