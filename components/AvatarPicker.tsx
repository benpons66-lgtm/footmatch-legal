// components/AvatarPicker.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Image, Modal, Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radius, Spacing } from '../constants/theme';

const { width } = Dimensions.get('window');

// Avatars manga style Olive & Tom — SVG via emoji + couleurs uniques
export const MANGA_AVATARS = [
  { id:'tsubasa',  emoji:'🦅', name:'Tsubasa',  hair:'#F5A623', skin:'#FDBCB4', accent:'#00FF66', desc:'Le prodige ailé'      },
  { id:'oliver',   emoji:'⚡', name:'Oliver',   hair:'#4A90D9', skin:'#FDBCB4', accent:'#4A90D9', desc:'Le capitaine'          },
  { id:'kojiro',   emoji:'🔥', name:'Kojiro',   hair:'#1A1A1A', skin:'#FDBCB4', accent:'#FF3D3D', desc:'Le buteur implacable'  },
  { id:'pierre',   emoji:'💎', name:'Pierre',   hair:'#8B4513', skin:'#C68642', accent:'#A78BFA', desc:'Le mur défensif'       },
  { id:'santana',  emoji:'🌪️', name:'Santana',  hair:'#2C1810', skin:'#8D5524', accent:'#FBBF24', desc:'La tornade du sud'     },
  { id:'hyuga',    emoji:'💥', name:'Hyuga',    hair:'#1A1A1A', skin:'#FDBCB4', accent:'#FF6B00', desc:'Le tir de tigre'       },
  { id:'misaki',   emoji:'🎯', name:'Misaki',   hair:'#8B0000', skin:'#FDBCB4', accent:'#F97316', desc:'Le stratège'           },
  { id:'wakabayashi', emoji:'🧤', name:'Wakaba', hair:'#4A4A4A', skin:'#FDBCB4', accent:'#60A5FA', desc:'Le gardien légendaire' },
];

interface Props {
  currentAvatar?: string;
  currentPhoto?: string;
  onSave: (data: { type: 'avatar'|'photo', avatarId?: string, photoUri?: string, photoBase64?: string }) => void;
  onClose: () => void;
}

export default function AvatarPicker({ currentAvatar, currentPhoto, onSave, onClose }: Props) {
  const [tab, setTab] = useState<'manga'|'photo'>('manga');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar ?? 'tsubasa');
  const [photoUri, setPhotoUri] = useState<string|null>(currentPhoto ?? null);
  const [photoBase64, setPhotoBase64] = useState<string|null>(null);

  async function handlePickPhoto() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée', 'Active l\'accès aux photos.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1,1], quality: 0.8, base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 ?? null);
        setTab('photo');
      }
    } catch (e:any) { Alert.alert('Erreur', e.message); }
  }

  async function handleTakePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée', 'Active l\'accès à la caméra.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, aspect: [1,1], quality: 0.8, base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 ?? null);
        setTab('photo');
      }
    } catch (e:any) { Alert.alert('Erreur', e.message); }
  }

  function handleSave() {
    if (tab === 'photo' && photoUri) {
      onSave({ type: 'photo', photoUri, photoBase64: photoBase64 ?? undefined });
    } else {
      onSave({ type: 'avatar', avatarId: selectedAvatar });
    }
  }

  const selectedAvatarData = MANGA_AVATARS.find(a => a.id === selectedAvatar)!;

  return (
    <Modal animationType="slide" transparent={false} presentationStyle="fullScreen">
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>Annuler</Text></TouchableOpacity>
          <Text style={s.headerTitle}>MON AVATAR</Text>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave}><Text style={s.saveBtnText}>Sauver</Text></TouchableOpacity>
        </View>

        {/* Prévisualisation */}
        <View style={s.preview}>
          <View style={[s.previewRing, { borderColor: selectedAvatarData?.accent ?? '#00FF66' }]}>
            {tab === 'photo' && photoUri ? (
              <Image source={{ uri: photoUri }} style={s.previewPhoto} />
            ) : (
              <View style={[s.previewAvatar, { backgroundColor: `${selectedAvatarData?.accent}22` }]}>
                <Text style={s.previewEmoji}>{selectedAvatarData?.emoji}</Text>
              </View>
            )}
          </View>
          <Text style={s.previewName}>{tab === 'photo' ? 'Ma photo' : selectedAvatarData?.name}</Text>
          <Text style={s.previewDesc}>{tab === 'photo' ? 'Photo personnalisée' : selectedAvatarData?.desc}</Text>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab==='manga' && s.tabActive]} onPress={()=>setTab('manga')}>
            <Text style={[s.tabText, tab==='manga' && s.tabTextActive]}>🎌 Avatars Manga</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab==='photo' && s.tabActive]} onPress={()=>setTab('photo')}>
            <Text style={[s.tabText, tab==='photo' && s.tabTextActive]}>📷 Ma Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        {tab === 'manga' ? (
          <ScrollView contentContainerStyle={s.grid}>
            <Text style={s.gridTitle}>Choisis ton personnage</Text>
            <View style={s.avatarGrid}>
              {MANGA_AVATARS.map(avatar => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <TouchableOpacity
                    key={avatar.id}
                    style={[s.avatarCard, isSelected && { borderColor: avatar.accent, backgroundColor: `${avatar.accent}15` }]}
                    onPress={() => setSelectedAvatar(avatar.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <View style={[s.selectedCheck, { backgroundColor: avatar.accent }]}><Text style={s.selectedCheckText}>✓</Text></View>}
                    <View style={[s.avatarIconWrap, { backgroundColor: `${avatar.accent}20` }]}>
                      <Text style={s.avatarEmoji}>{avatar.emoji}</Text>
                    </View>
                    <Text style={[s.avatarName, isSelected && { color: avatar.accent }]}>{avatar.name}</Text>
                    <Text style={s.avatarDesc}>{avatar.desc}</Text>
                    <View style={[s.avatarAccentBar, { backgroundColor: avatar.accent }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={s.photoSection}>
            <Text style={s.gridTitle}>Utilise ta vraie tête !</Text>
            <View style={s.photoButtons}>
              <TouchableOpacity style={s.photoBtn} onPress={handlePickPhoto}>
                <Text style={s.photoBtnEmoji}>🖼️</Text>
                <Text style={s.photoBtnLabel}>Galerie</Text>
                <Text style={s.photoBtnSub}>Choisir une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.photoBtn} onPress={handleTakePhoto}>
                <Text style={s.photoBtnEmoji}>📷</Text>
                <Text style={s.photoBtnLabel}>Caméra</Text>
                <Text style={s.photoBtnSub}>Prendre une photo</Text>
              </TouchableOpacity>
            </View>
            {photoUri && (
              <View style={s.photoPreviewWrap}>
                <Image source={{ uri: photoUri }} style={s.photoPreviewImg} />
                <TouchableOpacity style={s.removePhoto} onPress={() => { setPhotoUri(null); setPhotoBase64(null); setTab('manga'); }}>
                  <Text style={s.removePhotoText}>✕ Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
            {!photoUri && (
              <View style={s.noPhoto}>
                <Text style={s.noPhotoEmoji}>👤</Text>
                <Text style={s.noPhotoText}>Aucune photo sélectionnée</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:Colors.bg },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:Spacing.xl, paddingTop:56, paddingBottom:16, borderBottomWidth:1, borderBottomColor:Colors.border },
  cancel:         { color:Colors.textMuted, fontSize:15 },
  headerTitle:    { fontSize:16, fontWeight:'900', color:Colors.text, letterSpacing:2 },
  saveBtn:        { backgroundColor:Colors.green, borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:8 },
  saveBtnText:    { color:'#000', fontWeight:'900', fontSize:14 },

  preview:        { alignItems:'center', paddingVertical:24, borderBottomWidth:1, borderBottomColor:Colors.border },
  previewRing:    { width:100, height:100, borderRadius:50, borderWidth:3, alignItems:'center', justifyContent:'center', marginBottom:10 },
  previewPhoto:   { width:94, height:94, borderRadius:47 },
  previewAvatar:  { width:94, height:94, borderRadius:47, alignItems:'center', justifyContent:'center' },
  previewEmoji:   { fontSize:44 },
  previewName:    { fontSize:18, fontWeight:'900', color:Colors.text, textTransform:'uppercase', letterSpacing:1 },
  previewDesc:    { fontSize:12, color:Colors.textMuted, marginTop:3 },

  tabs:           { flexDirection:'row', borderBottomWidth:1, borderBottomColor:Colors.border },
  tab:            { flex:1, paddingVertical:14, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  tabActive:      { borderBottomColor:Colors.green },
  tabText:        { fontSize:13, fontWeight:'700', color:Colors.textMuted },
  tabTextActive:  { color:Colors.green },

  grid:           { padding:Spacing.xl },
  gridTitle:      { fontSize:13, color:Colors.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:16, fontWeight:'700' },
  avatarGrid:     { flexDirection:'row', flexWrap:'wrap', gap:12 },
  avatarCard:     { width:(width - 48 - 12) / 2, backgroundColor:Colors.card, borderRadius:Radius.lg, padding:14, borderWidth:1, borderColor:Colors.borderSubtle, alignItems:'center', gap:6, position:'relative' },
  selectedCheck:  { position:'absolute', top:8, right:8, width:20, height:20, borderRadius:10, alignItems:'center', justifyContent:'center' },
  selectedCheckText:{ color:'#000', fontSize:11, fontWeight:'900' },
  avatarIconWrap: { width:60, height:60, borderRadius:30, alignItems:'center', justifyContent:'center' },
  avatarEmoji:    { fontSize:32 },
  avatarName:     { fontSize:14, fontWeight:'900', color:Colors.text, textTransform:'uppercase', letterSpacing:0.5 },
  avatarDesc:     { fontSize:10, color:Colors.textMuted, textAlign:'center', lineHeight:14 },
  avatarAccentBar:{ height:3, width:'60%', borderRadius:2, marginTop:4 },

  photoSection:   { flex:1, padding:Spacing.xl },
  photoButtons:   { flexDirection:'row', gap:12, marginBottom:24 },
  photoBtn:       { flex:1, backgroundColor:Colors.card, borderRadius:Radius.lg, padding:20, alignItems:'center', gap:6, borderWidth:1, borderColor:Colors.borderSubtle },
  photoBtnEmoji:  { fontSize:32 },
  photoBtnLabel:  { fontSize:15, fontWeight:'900', color:Colors.text, textTransform:'uppercase' },
  photoBtnSub:    { fontSize:11, color:Colors.textMuted },
  photoPreviewWrap:{ alignItems:'center', gap:12 },
  photoPreviewImg:{ width:160, height:160, borderRadius:80, borderWidth:3, borderColor:Colors.green },
  removePhoto:    { backgroundColor:Colors.redDim, borderRadius:Radius.full, paddingHorizontal:16, paddingVertical:8, borderWidth:1, borderColor:'rgba(255,61,61,0.3)' },
  removePhotoText:{ color:Colors.red, fontWeight:'700', fontSize:13 },
  noPhoto:        { alignItems:'center', paddingTop:40, gap:12 },
  noPhotoEmoji:   { fontSize:52 },
  noPhotoText:    { fontSize:14, color:Colors.textMuted },
});
