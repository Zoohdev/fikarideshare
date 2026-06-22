import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WS_BASE = "ws://192.168.0.112:8000/ws/tracking/";

export default function RideChatScreen() {
  const params = useLocalSearchParams();
  const flatListRef = useRef(null);
  const chatSocketRef = useRef(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId,setCurrentUserId]=useState(null);
  const currentUserIdRef = useRef(null);
  // Crucial: We need to know who is sending the message to format the UI properly.
  // Defaults to rider if not explicitly passed.
  const myRole = params.role || "rider"; 
  const tripId = params.trip_id || params.ride_id;
  const CHAT_STORAGE_KEY = `@chat_history_${tripId}`;
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
        }
      } catch (error) {
        console.log("Could not load chat history", error);
      }
    };
    loadChatHistory();
  }, [tripId]);


  useEffect(() => {
    let isActive = true;

    const initializeChatSocket = async () => {
      const uid = await AsyncStorage.getItem("userId");
      setCurrentUserId(uid);
      currentUserIdRef.current = uid;
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId || !tripId) {
          console.error("Missing User ID or Trip ID for Chat");
          return;
        }

        const socketUrl = `${WS_BASE}?user_id=${userId}`;
        chatSocketRef.current = new WebSocket(socketUrl);

        chatSocketRef.current.onopen = () => {
          console.log("Chat WebSocket Connected");
          setIsConnected(true);
        
          // Join ride room
          chatSocketRef.current.send(
            JSON.stringify({
              type: "join_ride",
              ride_id: tripId,
            })
          );
        };

        chatSocketRef.current.onmessage = (event) => {
          if (!isActive) return;
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "joined_ride") {
              console.log("Successfully joined ride room");
              return;
            }

            if (data.type === "chat_received") {
              console.log(
                "CHAT RECEIVED:",
                JSON.stringify(data, null, 2)
              );// Ignore the server broadcast if we were the sender (since we already rendered it locally)
              if (
                String(data.sender_id) ===
                String(currentUserIdRef.current)
              ) {
                console.log("Ignoring my own broadcast");
                return;
              }
              console.log(
                "sender_id:",
                data.sender_id
              );
              
              console.log(
                "currentUserId:",
                currentUserId
              );
              const lastMsg = messages[messages.length - 1];

if (
  lastMsg &&
  lastMsg.text === data.message &&
  lastMsg.sender === data.role
) {
  return;
}
              const incomingMsg = {
                id: Date.now().toString() + Math.random().toString(),
                sender: data.role, 
                text: data.message,
                time: new Date(data.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };

              setMessages((prev) => {
                const updatedMessages = [...prev, incomingMsg];
                AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages));
                return updatedMessages;
              });
              
              // Scroll to bottom when new message arrives
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 200);
            }
          } catch (err) {
            console.error("Chat Socket Parse Error:", err);
          }
        };

        chatSocketRef.current.onclose = () => setIsConnected(false);

      } catch (error) {
        console.error("Socket Initialization Failed", error);
      }
    };

    initializeChatSocket();

    return () => {
      isActive = false;
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
      }
    };
  }, [tripId]);

  
  const sendMessage = () => {
    if (!message.trim() || !isConnected) return;

    const messageText = message.trim();
    console.log({
      ride_id: tripId,
      target_user_id: params.target_user_id,
      message: messageText,
      role: myRole,
    });
    // 1. Send payload to backend
    chatSocketRef.current.send(JSON.stringify({
      type: "chat_message",
      ride_id: tripId,
      target_user_id: params.target_user_id,
      message: messageText,
      role: myRole
    }));

    // 2. Instantly update local UI so the user doesn't have to wait for the server roundtrip
    const localMsg = {
      id: Date.now().toString() + Math.random().toString(),
      sender: myRole,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    setMessages((prev) => {
      const updatedMessages = [...prev, localMsg];
      AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    setMessage("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({ item }) => {
    // Check if the sender of this message matches my current role
    const isMine = item.sender === myRole;

    return (
      <View style={[styles.messageWrapper, isMine ? styles.myWrapper : styles.otherWrapper]}>
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMine && { color: "#fff" }]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMine && { color: "rgba(255,255,255,0.7)" }]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.driverName}>
            {params.driver_name || (myRole === 'rider' ? 'Driver' : 'Rider')}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#22C55E' : '#EF4444' }]} />
            <Text style={styles.onlineText}>
              {isConnected ? "Connected" : "Connecting..."}
            </Text>
          </View>
        </View>
      </View>

      {/* CHAT LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isConnected ? (
              <Text style={styles.emptyText}>Send a message to start chatting.</Text>
            ) : (
              <ActivityIndicator size="small" color="#FF8811" />
            )}
          </View>
        }
      />

      {/* INPUT */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            maxLength={250}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!message.trim() || !isConnected) && styles.sendButtonDisabled]} 
            onPress={sendMessage}
            disabled={!message.trim() || !isConnected}
          >
            <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: { height: 70, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#F2F2F2", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitleContainer: { marginLeft: 10, flex: 1 },
  driverName: { fontSize: 18, fontWeight: "700", color: "#111" },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  onlineText: { color: "#666", fontSize: 13, fontWeight: "500" },
  flatListContent: { padding: 15, paddingBottom: 30 },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#999", fontSize: 14 },
  messageWrapper: { marginBottom: 16, flexDirection: "row" },
  myWrapper: { justifyContent: "flex-end" },
  otherWrapper: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "75%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  myBubble: { backgroundColor: "#FF8811", borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#F0F0F0" },
  messageText: { fontSize: 15, color: "#111", lineHeight: 20 },
  timeText: { marginTop: 6, fontSize: 10, color: "#888", alignSelf: "flex-end" },
  inputContainer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 15, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F1F1F1", backgroundColor: "#FFF" },
  input: { flex: 1, minHeight: 45, maxHeight: 100, backgroundColor: "#F8F8F8", borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, marginRight: 12, fontSize: 15, color: "#333", borderWidth: 1, borderColor: "#EFEFEF" },
  sendButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FF8811", justifyContent: "center", alignItems: "center", marginBottom: 1 },
  sendButtonDisabled: { backgroundColor: "#FFD1A3" },
});