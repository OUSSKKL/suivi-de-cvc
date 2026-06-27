import { supabase } from "./supabaseClient";
import { uid } from "./uid";

const PHOTOS_BUCKET = "photos";

function mapSite(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address || "",
    order: row.order,
    kits: row.kits ?? 0,
    createdAt: row.created_at,
  };
}

function mapReleve(row) {
  return { id: row.id, siteId: row.site_id, date: row.date };
}

function mapChaudiere(row) {
  return {
    id: row.id,
    siteId: row.site_id,
    marque: row.marque || "",
    modele: row.modele || "",
    photo: row.photo_url || "",
    quantite: row.quantite ?? 1,
  };
}

function mapPhoto(row) {
  return {
    id: row.id,
    siteId: row.site_id,
    label: row.label || "",
    url: row.photo_url,
    date: row.date,
  };
}

// ---------- Stockage des images (plaques signalétiques, photos de pompes) ----------

export async function uploadImage(file, folder) {
  const path = `${folder}/${uid()}-${file.name.replace(/\s+/g, "_")}`;
  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeImage(url) {
  const marker = `/object/public/${PHOTOS_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const path = decodeURIComponent(url.slice(i + marker.length));
  await supabase.storage.from(PHOTOS_BUCKET).remove([path]);
}

// ---------- Sites ----------

export async function listSites() {
  const { data, error } = await supabase.from("sites").select("*");
  if (error) throw error;
  return data.map(mapSite);
}

export async function createSite(name, address) {
  const { data, error } = await supabase
    .from("sites")
    .insert({ id: uid(), name, address })
    .select()
    .single();
  if (error) throw error;
  return mapSite(data);
}

export async function deleteSite(id) {
  const { error } = await supabase.from("sites").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSiteName(id, name) {
  const { error } = await supabase.from("sites").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function updateSiteKits(id, kits) {
  const { error } = await supabase.from("sites").update({ kits }).eq("id", id);
  if (error) throw error;
}

// ---------- Relevés (compteurs) ----------

export async function listReleves(siteId) {
  const { data, error } = await supabase.from("releves").select("*").eq("site_id", siteId);
  if (error) throw error;
  return data.map(mapReleve);
}

export async function listAllReleves() {
  const { data, error } = await supabase.from("releves").select("*");
  if (error) throw error;
  return data.map(mapReleve);
}

export async function addReleve(siteId, date) {
  const { data, error } = await supabase
    .from("releves")
    .insert({ id: uid(), site_id: siteId, date })
    .select()
    .single();
  if (error) throw error;
  return mapReleve(data);
}

export async function deleteReleve(id) {
  const { error } = await supabase.from("releves").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Chaudières ----------

export async function listChaudieres(siteId) {
  const { data, error } = await supabase
    .from("chaudieres")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapChaudiere);
}

export async function listAllChaudieres() {
  const { data, error } = await supabase.from("chaudieres").select("*");
  if (error) throw error;
  return data.map(mapChaudiere);
}

export async function createChaudiere(siteId, { marque, modele, photoUrl }) {
  const { data, error } = await supabase
    .from("chaudieres")
    .insert({ id: uid(), site_id: siteId, marque, modele, photo_url: photoUrl || null })
    .select()
    .single();
  if (error) throw error;
  return mapChaudiere(data);
}

export async function updateChaudiere(id, { marque, modele, photoUrl }) {
  const { data, error } = await supabase
    .from("chaudieres")
    .update({ marque, modele, photo_url: photoUrl || null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapChaudiere(data);
}

export async function deleteChaudiere(id) {
  const { error } = await supabase.from("chaudieres").delete().eq("id", id);
  if (error) throw error;
}

export async function updateChaudiereQuantite(id, quantite) {
  const { error } = await supabase.from("chaudieres").update({ quantite }).eq("id", id);
  if (error) throw error;
}

// ---------- Photos ----------

export async function listPhotos(siteId) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(mapPhoto);
}

export async function addPhoto(siteId, { label, url, date }) {
  const { data, error } = await supabase
    .from("photos")
    .insert({ id: uid(), site_id: siteId, label, photo_url: url, date })
    .select()
    .single();
  if (error) throw error;
  return mapPhoto(data);
}

export async function deletePhoto(id) {
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw error;
}
