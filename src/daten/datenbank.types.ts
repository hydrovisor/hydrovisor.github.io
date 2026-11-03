
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "anlage": {
                  Row: {
                    "aktiv": boolean,"app_version": string,"client_id": string | null,"datenart": Database["public"]['Enums']["datenart"],"ec_wasser_annahme": number,"erfasst_am": string,"id": string,"karbonathaerte_dh": number | null,"kuerzel": string,"laufweg": (string)[],"licht_bis": string | null,"licht_von": string | null,"luefter_einstellung": string | null,"name": string,"standort": Database["public"]['Enums']["standort"],"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aktiv"?: boolean,"app_version": string,"client_id"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"],"ec_wasser_annahme"?: number,"erfasst_am"?: string,"id"?: string,"karbonathaerte_dh"?: number | null,"kuerzel": string,"laufweg"?: (string)[],"licht_bis"?: string | null,"licht_von"?: string | null,"luefter_einstellung"?: string | null,"name": string,"standort"?: Database["public"]['Enums']["standort"],"storniert_am"?: string | null
                  }
                  Update: {
                    "aktiv"?: boolean,"app_version"?: string,"client_id"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"],"ec_wasser_annahme"?: number,"erfasst_am"?: string,"id"?: string,"karbonathaerte_dh"?: number | null,"kuerzel"?: string,"laufweg"?: (string)[],"licht_bis"?: string | null,"licht_von"?: string | null,"luefter_einstellung"?: string | null,"name"?: string,"standort"?: Database["public"]['Enums']["standort"],"storniert_am"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"ansatz_position": {
                  Row: {
                    "ansatz_id": string,"app_version": string,"bezugsvolumen_l": number,"client_id": string,"erfasst_am": string,"id": string,"ist_ml": number | null,"produkt_id": string,"soll_ml": number,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ansatz_id": string,"app_version": string,"bezugsvolumen_l": number,"client_id": string,"erfasst_am"?: string,"id"?: string,"ist_ml"?: number | null,"produkt_id": string,"soll_ml": number,"storniert_am"?: string | null
                  }
                  Update: {
                    "ansatz_id"?: string,"app_version"?: string,"bezugsvolumen_l"?: number,"client_id"?: string,"erfasst_am"?: string,"id"?: string,"ist_ml"?: number | null,"produkt_id"?: string,"soll_ml"?: number,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ansatz_position_ansatz_id_fkey"
      columns: ["ansatz_id"]
isOneToOne: false
      referencedRelation: "naehrloesungsansatz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ansatz_position_produkt_id_fkey"
      columns: ["produkt_id"]
isOneToOne: false
      referencedRelation: "produkt"
      referencedColumns: ["produkt_id"]
    }
                  ]
                },"ansatz_schritt": {
                  Row: {
                    "ansatz_id": string,"app_version": string,"client_id": string,"erfasst_am": string,"erledigt_am": string | null,"id": string,"ist_ml": number | null,"nr": number,"ph_minus_ml": number | null,"schritt": Database["public"]['Enums']["ansatz_schritt_typ"],"soll_ml": number | null,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ansatz_id": string,"app_version": string,"client_id": string,"erfasst_am"?: string,"erledigt_am"?: string | null,"id"?: string,"ist_ml"?: number | null,"nr": number,"ph_minus_ml"?: number | null,"schritt": Database["public"]['Enums']["ansatz_schritt_typ"],"soll_ml"?: number | null,"storniert_am"?: string | null
                  }
                  Update: {
                    "ansatz_id"?: string,"app_version"?: string,"client_id"?: string,"erfasst_am"?: string,"erledigt_am"?: string | null,"id"?: string,"ist_ml"?: number | null,"nr"?: number,"ph_minus_ml"?: number | null,"schritt"?: Database["public"]['Enums']["ansatz_schritt_typ"],"soll_ml"?: number | null,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ansatz_schritt_ansatz_id_fkey"
      columns: ["ansatz_id"]
isOneToOne: false
      referencedRelation: "naehrloesungsansatz"
      referencedColumns: ["id"]
    }
                  ]
                },"anzuchtort": {
                  Row: {
                    "app_version": string,"client_id": string | null,"erfasst_am": string,"id": string,"platz_id": string,"platzzahl": number,"position": Database["public"]['Enums']["position_vh"],"storniert_am": string | null,"typ": Database["public"]['Enums']["anzuchtort_typ"]
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"platz_id": string,"platzzahl"?: number,"position": Database["public"]['Enums']["position_vh"],"storniert_am"?: string | null,"typ": Database["public"]['Enums']["anzuchtort_typ"]
                  }
                  Update: {
                    "app_version"?: string,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"platz_id"?: string,"platzzahl"?: number,"position"?: Database["public"]['Enums']["position_vh"],"storniert_am"?: string | null,"typ"?: Database["public"]['Enums']["anzuchtort_typ"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "anzuchtort_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: true
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "anzuchtort_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: true
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "anzuchtort_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: true
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "anzuchtort_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: true
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "anzuchtort_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: true
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"art": {
                  Row: {
                    "app_version": string,"art_id": string,"aussaatfenster_bis_monat": number | null,"aussaatfenster_von_monat": number | null,"bestaeubung_noetig": boolean | null,"commit": string,"erfasst_am": string,"freigegeben_am": string | null,"gbif_key": number | null,"gueltig_ab": string,"gueltig_bis": string | null,"id": string,"keimlinge_je_knaeuel": number | null,"kritische_tageslaenge_h": number | null,"kulturform_vorgabe": Database["public"]['Enums']["kulturform"] | null,"kulturformen_erlaubt": (Database["public"]['Enums']["kulturform"])[],"kulturgruppe_id": string,"liter_je_pflanze": number | null,"liter_status": Database["public"]['Enums']["liter_status"],"name_de": string,"name_wiss": string,"pflanzen_je_m2": number | null,"photoperiode": Database["public"]['Enums']["photoperiode"] | null,"pythium": Database["public"]['Enums']["pythium"] | null,"quelldatei": string,"samentyp": string | null,"schossen_handlung": Database["public"]['Enums']["schossen_handlung"] | null,"standard_keimfaehigkeit": number | null,"systemeignung": Database["public"]['Enums']["systemeignung"] | null,"umsetzen_ab_d": number | null,"umsetzen_bis_d": number | null,"wasserbedarf_je_pflanze_l": number | null,"wuchsform": Database["public"]['Enums']["wuchsform"] | null,"wuchshoehe_max_mm": number | null,"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"art_id": string,"aussaatfenster_bis_monat"?: number | null,"aussaatfenster_von_monat"?: number | null,"bestaeubung_noetig"?: boolean | null,"commit": string,"erfasst_am"?: string,"freigegeben_am"?: string | null,"gbif_key"?: number | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"keimlinge_je_knaeuel"?: number | null,"kritische_tageslaenge_h"?: number | null,"kulturform_vorgabe"?: Database["public"]['Enums']["kulturform"] | null,"kulturformen_erlaubt"?: (Database["public"]['Enums']["kulturform"])[],"kulturgruppe_id": string,"liter_je_pflanze"?: number | null,"liter_status"?: Database["public"]['Enums']["liter_status"],"name_de": string,"name_wiss": string,"pflanzen_je_m2"?: number | null,"photoperiode"?: Database["public"]['Enums']["photoperiode"] | null,"pythium"?: Database["public"]['Enums']["pythium"] | null,"quelldatei": string,"samentyp"?: string | null,"schossen_handlung"?: Database["public"]['Enums']["schossen_handlung"] | null,"standard_keimfaehigkeit"?: number | null,"systemeignung"?: Database["public"]['Enums']["systemeignung"] | null,"umsetzen_ab_d"?: number | null,"umsetzen_bis_d"?: number | null,"wasserbedarf_je_pflanze_l"?: number | null,"wuchsform"?: Database["public"]['Enums']["wuchsform"] | null,"wuchshoehe_max_mm"?: number | null,"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"art_id"?: string,"aussaatfenster_bis_monat"?: number | null,"aussaatfenster_von_monat"?: number | null,"bestaeubung_noetig"?: boolean | null,"commit"?: string,"erfasst_am"?: string,"freigegeben_am"?: string | null,"gbif_key"?: number | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"keimlinge_je_knaeuel"?: number | null,"kritische_tageslaenge_h"?: number | null,"kulturform_vorgabe"?: Database["public"]['Enums']["kulturform"] | null,"kulturformen_erlaubt"?: (Database["public"]['Enums']["kulturform"])[],"kulturgruppe_id"?: string,"liter_je_pflanze"?: number | null,"liter_status"?: Database["public"]['Enums']["liter_status"],"name_de"?: string,"name_wiss"?: string,"pflanzen_je_m2"?: number | null,"photoperiode"?: Database["public"]['Enums']["photoperiode"] | null,"pythium"?: Database["public"]['Enums']["pythium"] | null,"quelldatei"?: string,"samentyp"?: string | null,"schossen_handlung"?: Database["public"]['Enums']["schossen_handlung"] | null,"standard_keimfaehigkeit"?: number | null,"systemeignung"?: Database["public"]['Enums']["systemeignung"] | null,"umsetzen_ab_d"?: number | null,"umsetzen_bis_d"?: number | null,"wasserbedarf_je_pflanze_l"?: number | null,"wuchsform"?: Database["public"]['Enums']["wuchsform"] | null,"wuchshoehe_max_mm"?: number | null,"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "art_art_id_fkey"
      columns: ["art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    },{
      foreignKeyName: "art_kulturgruppe_id_fkey"
      columns: ["kulturgruppe_id"]
isOneToOne: false
      referencedRelation: "kulturgruppe"
      referencedColumns: ["kulturgruppe_id"]
    }
                  ]
                },"art_kulturform": {
                  Row: {
                    "app_version": string,"art_id": string,"commit": string,"entspitzen": boolean,"erfasst_am": string,"ernte_ab_d": number | null,"ernteart": Database["public"]['Enums']["ernteart"],"ernteintervall_d": number | null,"freigegeben_am": string | null,"gueltig_ab": string,"gueltig_bis": string | null,"id": string,"kulturdauer_max_d": number | null,"kulturdauer_typisch_d": number | null,"kulturform": Database["public"]['Enums']["kulturform"],"quelldatei": string,"schnitte_max": number | null,"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"art_id": string,"commit": string,"entspitzen"?: boolean,"erfasst_am"?: string,"ernte_ab_d"?: number | null,"ernteart": Database["public"]['Enums']["ernteart"],"ernteintervall_d"?: number | null,"freigegeben_am"?: string | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturdauer_max_d"?: number | null,"kulturdauer_typisch_d"?: number | null,"kulturform": Database["public"]['Enums']["kulturform"],"quelldatei": string,"schnitte_max"?: number | null,"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"art_id"?: string,"commit"?: string,"entspitzen"?: boolean,"erfasst_am"?: string,"ernte_ab_d"?: number | null,"ernteart"?: Database["public"]['Enums']["ernteart"],"ernteintervall_d"?: number | null,"freigegeben_am"?: string | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturdauer_max_d"?: number | null,"kulturdauer_typisch_d"?: number | null,"kulturform"?: Database["public"]['Enums']["kulturform"],"quelldatei"?: string,"schnitte_max"?: number | null,"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "art_kulturform_art_id_fkey"
      columns: ["art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    }
                  ]
                },"art_schluessel": {
                  Row: {
                    "art_id": string,"erfasst_am": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "art_id": string,"erfasst_am"?: string,"id"?: string
                  }
                  Update: {
                    "art_id"?: string,"erfasst_am"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"aufgabe_tagesliste": {
                  Row: {
                    "app_version": string,"aufgabe_schluessel": string,"erfasst_am": string,"faellig_am": string,"id": string,"platz_id": string | null,"tag": string,"typ": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"aufgabe_schluessel": string,"erfasst_am"?: string,"faellig_am": string,"id"?: string,"platz_id"?: string | null,"tag": string,"typ": string
                  }
                  Update: {
                    "app_version"?: string,"aufgabe_schluessel"?: string,"erfasst_am"?: string,"faellig_am"?: string,"id"?: string,"platz_id"?: string | null,"tag"?: string,"typ"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "aufgabe_tagesliste_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "aufgabe_tagesliste_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "aufgabe_tagesliste_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "aufgabe_tagesliste_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "aufgabe_tagesliste_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"aufschub": {
                  Row: {
                    "app_version": string,"art": Database["public"]['Enums']["aufschub_art"],"aufgabe_schluessel": string,"client_id": string,"client_zeit": string | null,"datenart": Database["public"]['Enums']["datenart"],"erfasst_am": string,"ersetzt_id": string | null,"gesetzt_am": string,"gilt_ab": string,"id": string,"nacherfasst": boolean | null,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"art": Database["public"]['Enums']["aufschub_art"],"aufgabe_schluessel": string,"client_id": string,"client_zeit"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"],"erfasst_am"?: string,"ersetzt_id"?: string | null,"gesetzt_am": string,"gilt_ab": string,"id"?: string,"nacherfasst"?: never,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null
                  }
                  Update: {
                    "app_version"?: string,"art"?: Database["public"]['Enums']["aufschub_art"],"aufgabe_schluessel"?: string,"client_id"?: string,"client_zeit"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"],"erfasst_am"?: string,"ersetzt_id"?: string | null,"gesetzt_am"?: string,"gilt_ab"?: string,"id"?: string,"nacherfasst"?: never,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "aufschub_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "aufschub"
      referencedColumns: ["id"]
    }
                  ]
                },"auswertung_fenster": {
                  Row: {
                    "app_version": string,"bis": string,"erfasst_am": string,"id": string,"name": string,"von": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"bis": string,"erfasst_am"?: string,"id"?: string,"name": string,"von": string
                  }
                  Update: {
                    "app_version"?: string,"bis"?: string,"erfasst_am"?: string,"id"?: string,"name"?: string,"von"?: string
                  }
                  Relationships: [
                    
                  ]
                },"backup_status": {
                  Row: {
                    "app_version": string,"erfasst_am": string,"groesse_bytes": number | null,"id": string,"letzte_wiederherstellungsprobe_am": string | null,"letztes_backup_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"erfasst_am"?: string,"groesse_bytes"?: number | null,"id"?: string,"letzte_wiederherstellungsprobe_am"?: string | null,"letztes_backup_am"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"erfasst_am"?: string,"groesse_bytes"?: number | null,"id"?: string,"letzte_wiederherstellungsprobe_am"?: string | null,"letztes_backup_am"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"bereich": {
                  Row: {
                    "anlage_id": string,"app_version": string,"client_id": string | null,"erfasst_am": string,"gemessen_am": string | null,"id": string,"lichtleisten": number | null,"lichtstunden": number | null,"name": string,"nummer": number,"nutzbare_hoehe_mm": number | null,"standard_betriebsart": Database["public"]['Enums']["betriebsart"] | null,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anlage_id": string,"app_version": string,"client_id"?: string | null,"erfasst_am"?: string,"gemessen_am"?: string | null,"id"?: string,"lichtleisten"?: number | null,"lichtstunden"?: number | null,"name": string,"nummer": number,"nutzbare_hoehe_mm"?: number | null,"standard_betriebsart"?: Database["public"]['Enums']["betriebsart"] | null,"storniert_am"?: string | null
                  }
                  Update: {
                    "anlage_id"?: string,"app_version"?: string,"client_id"?: string | null,"erfasst_am"?: string,"gemessen_am"?: string | null,"id"?: string,"lichtleisten"?: number | null,"lichtstunden"?: number | null,"name"?: string,"nummer"?: number,"nutzbare_hoehe_mm"?: number | null,"standard_betriebsart"?: Database["public"]['Enums']["betriebsart"] | null,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "bereich_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "anlage"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bereich_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_ec_wasser"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "bereich_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_saeurebedarf"
      referencedColumns: ["anlage_id"]
    }
                  ]
                },"deckeltyp": {
                  Row: {
                    "app_version": string,"client_id": string | null,"erfasst_am": string,"id": string,"loecher_je_reihe": (number)[],"name": string,"service_oeffnung": boolean,"storniert_am": string | null,"topfdurchmesser_mm": number
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"loecher_je_reihe": (number)[],"name": string,"service_oeffnung"?: boolean,"storniert_am"?: string | null,"topfdurchmesser_mm": number
                  }
                  Update: {
                    "app_version"?: string,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"loecher_je_reihe"?: (number)[],"name"?: string,"service_oeffnung"?: boolean,"storniert_am"?: string | null,"topfdurchmesser_mm"?: number
                  }
                  Relationships: [
                    
                  ]
                },"duengerschema": {
                  Row: {
                    "app_version": string,"bloom_ml_l": number,"commit": string,"ec_basis": Database["public"]['Enums']["ec_basis"],"ec_richtwert_max": number | null,"ec_richtwert_min": number | null,"erfasst_am": string,"evidenzklasse": Database["public"]['Enums']["evidenzklasse"],"freigegeben_am": string | null,"fundstelle": string,"grow_ml_l": number,"gueltig_ab": string,"gueltig_bis": string | null,"herkunft": Database["public"]['Enums']["herkunft_duenger"],"id": string,"kurzzitat": string,"micro_ml_l": number,"mischregeln": string | null,"quelldatei": string,"quelle_id": string,"stadium": Database["public"]['Enums']["stadium"],"summe_ml_l": number,"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"bloom_ml_l": number,"commit": string,"ec_basis"?: Database["public"]['Enums']["ec_basis"],"ec_richtwert_max"?: number | null,"ec_richtwert_min"?: number | null,"erfasst_am"?: string,"evidenzklasse"?: Database["public"]['Enums']["evidenzklasse"],"freigegeben_am"?: string | null,"fundstelle": string,"grow_ml_l": number,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"herkunft": Database["public"]['Enums']["herkunft_duenger"],"id"?: string,"kurzzitat": string,"micro_ml_l": number,"mischregeln"?: string | null,"quelldatei": string,"quelle_id": string,"stadium": Database["public"]['Enums']["stadium"],"summe_ml_l": number,"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"bloom_ml_l"?: number,"commit"?: string,"ec_basis"?: Database["public"]['Enums']["ec_basis"],"ec_richtwert_max"?: number | null,"ec_richtwert_min"?: number | null,"erfasst_am"?: string,"evidenzklasse"?: Database["public"]['Enums']["evidenzklasse"],"freigegeben_am"?: string | null,"fundstelle"?: string,"grow_ml_l"?: number,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"herkunft"?: Database["public"]['Enums']["herkunft_duenger"],"id"?: string,"kurzzitat"?: string,"micro_ml_l"?: number,"mischregeln"?: string | null,"quelldatei"?: string,"quelle_id"?: string,"stadium"?: Database["public"]['Enums']["stadium"],"summe_ml_l"?: number,"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "duengerschema_quelle_id_fkey"
      columns: ["quelle_id"]
isOneToOne: false
      referencedRelation: "quelle"
      referencedColumns: ["quelle_id"]
    }
                  ]
                },"eigene_aufgabe": {
                  Row: {
                    "anlage_id": string,"app_version": string,"client_id": string | null,"erfasst_am": string,"id": string,"intervall_d": number,"letzte_erledigung": string | null,"name": string,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anlage_id": string,"app_version": string,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"intervall_d": number,"letzte_erledigung"?: string | null,"name": string,"storniert_am"?: string | null
                  }
                  Update: {
                    "anlage_id"?: string,"app_version"?: string,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"intervall_d"?: number,"letzte_erledigung"?: string | null,"name"?: string,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "eigene_aufgabe_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "anlage"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "eigene_aufgabe_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_ec_wasser"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "eigene_aufgabe_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_saeurebedarf"
      referencedColumns: ["anlage_id"]
    }
                  ]
                },"einstellung": {
                  Row: {
                    "app_version": string,"email_rueckfall": boolean,"erfasst_am": string,"feste_kalibriertermine": (string)[],"id": string,"kannengroesse_l": number,"messbecher": boolean,"messmittel_ml": (number)[],"min_client_version": string,"pflegebudget_h_woche": number,"pflegebudget_min_werktag": number,"push_zeit": string,"stationsgrenze_ab": string,"telefon_vertretung": string | null,"thema": Database["public"]['Enums']["thema"],"vorlauf_n": number,"zeitzone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"email_rueckfall"?: boolean,"erfasst_am"?: string,"feste_kalibriertermine"?: (string)[],"id"?: string,"kannengroesse_l"?: number,"messbecher"?: boolean,"messmittel_ml"?: (number)[],"min_client_version"?: string,"pflegebudget_h_woche"?: number,"pflegebudget_min_werktag"?: number,"push_zeit"?: string,"stationsgrenze_ab"?: string,"telefon_vertretung"?: string | null,"thema"?: Database["public"]['Enums']["thema"],"vorlauf_n"?: number,"zeitzone"?: string
                  }
                  Update: {
                    "app_version"?: string,"email_rueckfall"?: boolean,"erfasst_am"?: string,"feste_kalibriertermine"?: (string)[],"id"?: string,"kannengroesse_l"?: number,"messbecher"?: boolean,"messmittel_ml"?: (number)[],"min_client_version"?: string,"pflegebudget_h_woche"?: number,"pflegebudget_min_werktag"?: number,"push_zeit"?: string,"stationsgrenze_ab"?: string,"telefon_vertretung"?: string | null,"thema"?: Database["public"]['Enums']["thema"],"vorlauf_n"?: number,"zeitzone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ereignis": {
                  Row: {
                    "anlage_id": string | null,"app_version": string,"art_id": string | null,"aufgabe_schluessel": string | null,"bereich_id": string | null,"client_id": string,"client_zeit": string | null,"daten": NonNullable<Json>,"dauer_s": number | null,"erfasst_am": string,"ersetzt_id": string | null,"gilt_ab": string,"id": string,"messgeraet_id": string | null,"nacherfasst": boolean | null,"netztopf_id": string | null,"pflanzung_id": string | null,"platz_id": string | null,"satz_id": string | null,"sorte_id": string | null,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null,"typ": Database["public"]['Enums']["ereignis_typ"],"war_faellig_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anlage_id"?: string | null,"app_version": string,"art_id"?: string | null,"aufgabe_schluessel"?: string | null,"bereich_id"?: string | null,"client_id": string,"client_zeit"?: string | null,"daten"?: NonNullable<Json>,"dauer_s"?: number | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab": string,"id"?: string,"messgeraet_id"?: string | null,"nacherfasst"?: never,"netztopf_id"?: string | null,"pflanzung_id"?: string | null,"platz_id"?: string | null,"satz_id"?: string | null,"sorte_id"?: string | null,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"typ": Database["public"]['Enums']["ereignis_typ"],"war_faellig_am"?: string | null
                  }
                  Update: {
                    "anlage_id"?: string | null,"app_version"?: string,"art_id"?: string | null,"aufgabe_schluessel"?: string | null,"bereich_id"?: string | null,"client_id"?: string,"client_zeit"?: string | null,"daten"?: NonNullable<Json>,"dauer_s"?: number | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab"?: string,"id"?: string,"messgeraet_id"?: string | null,"nacherfasst"?: never,"netztopf_id"?: string | null,"pflanzung_id"?: string | null,"platz_id"?: string | null,"satz_id"?: string | null,"sorte_id"?: string | null,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"typ"?: Database["public"]['Enums']["ereignis_typ"],"war_faellig_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ereignis_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "anlage"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_ec_wasser"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "ereignis_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_saeurebedarf"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "ereignis_art_id_fkey"
      columns: ["art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    },{
      foreignKeyName: "ereignis_bereich_id_fkey"
      columns: ["bereich_id"]
isOneToOne: false
      referencedRelation: "bereich"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "ereignis"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_messgeraet_id_fkey"
      columns: ["messgeraet_id"]
isOneToOne: false
      referencedRelation: "messgeraet"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_messgeraet_id_fkey"
      columns: ["messgeraet_id"]
isOneToOne: false
      referencedRelation: "v_kalibrierung_faellig"
      referencedColumns: ["messgeraet_id"]
    },{
      foreignKeyName: "ereignis_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "netztopf"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "v_netztopf_platz"
      referencedColumns: ["netztopf_id"]
    },{
      foreignKeyName: "ereignis_pflanzung_id_fkey"
      columns: ["pflanzung_id"]
isOneToOne: false
      referencedRelation: "pflanzung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_pflanzung_id_fkey"
      columns: ["pflanzung_id"]
isOneToOne: false
      referencedRelation: "v_pflanzung_zustand"
      referencedColumns: ["pflanzung_id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "ereignis_satz_id_fkey"
      columns: ["satz_id"]
isOneToOne: false
      referencedRelation: "satz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_satz_id_fkey"
      columns: ["satz_id"]
isOneToOne: false
      referencedRelation: "v_folgesatz"
      referencedColumns: ["satz_id"]
    },{
      foreignKeyName: "ereignis_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"etikett": {
                  Row: {
                    "app_version": string,"client_id": string | null,"code": string,"erfasst_am": string,"format": Database["public"]['Enums']["etikett_format"],"gedruckt_am": string | null,"id": string,"platz_id": string,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"client_id"?: string | null,"code": string,"erfasst_am"?: string,"format"?: Database["public"]['Enums']["etikett_format"],"gedruckt_am"?: string | null,"id"?: string,"platz_id": string,"storniert_am"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"client_id"?: string | null,"code"?: string,"erfasst_am"?: string,"format"?: Database["public"]['Enums']["etikett_format"],"gedruckt_am"?: string | null,"id"?: string,"platz_id"?: string,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "etikett_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "etikett_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "etikett_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "etikett_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "etikett_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"etikett_aufruf": {
                  Row: {
                    "app_version": string,"aufgerufen_am": string,"client_id": string | null,"code": string,"erfasst_am": string,"ergebnis": Database["public"]['Enums']["etikett_ergebnis"],"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"aufgerufen_am"?: string,"client_id"?: string | null,"code": string,"erfasst_am"?: string,"ergebnis": Database["public"]['Enums']["etikett_ergebnis"],"id"?: string
                  }
                  Update: {
                    "app_version"?: string,"aufgerufen_am"?: string,"client_id"?: string | null,"code"?: string,"erfasst_am"?: string,"ergebnis"?: Database["public"]['Enums']["etikett_ergebnis"],"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"gefaess": {
                  Row: {
                    "app_version": string,"betriebsart": Database["public"]['Enums']["betriebsart"],"betriebsvolumen_l": number,"client_id": string | null,"deckeltyp_id": string,"erfasst_am": string,"feste_dosis": boolean,"gefaessmodell_id": string,"gueltig_bis": string | null,"gueltig_von": string,"id": string,"intervall_messen_d": number,"intervall_nachfuellen_d": number | null,"intervall_wechseln_d": number | null,"luftpumpe": Database["public"]['Enums']["luftpumpe"] | null,"naechster_wechsel_am": string | null,"platz_id": string,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"betriebsart": Database["public"]['Enums']["betriebsart"],"betriebsvolumen_l": number,"client_id"?: string | null,"deckeltyp_id": string,"erfasst_am"?: string,"feste_dosis"?: boolean,"gefaessmodell_id": string,"gueltig_bis"?: string | null,"gueltig_von"?: string,"id"?: string,"intervall_messen_d": number,"intervall_nachfuellen_d"?: number | null,"intervall_wechseln_d"?: number | null,"luftpumpe"?: Database["public"]['Enums']["luftpumpe"] | null,"naechster_wechsel_am"?: string | null,"platz_id": string,"storniert_am"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"betriebsart"?: Database["public"]['Enums']["betriebsart"],"betriebsvolumen_l"?: number,"client_id"?: string | null,"deckeltyp_id"?: string,"erfasst_am"?: string,"feste_dosis"?: boolean,"gefaessmodell_id"?: string,"gueltig_bis"?: string | null,"gueltig_von"?: string,"id"?: string,"intervall_messen_d"?: number,"intervall_nachfuellen_d"?: number | null,"intervall_wechseln_d"?: number | null,"luftpumpe"?: Database["public"]['Enums']["luftpumpe"] | null,"naechster_wechsel_am"?: string | null,"platz_id"?: string,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gefaess_deckeltyp_id_fkey"
      columns: ["deckeltyp_id"]
isOneToOne: false
      referencedRelation: "deckeltyp"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gefaess_gefaessmodell_id_fkey"
      columns: ["gefaessmodell_id"]
isOneToOne: false
      referencedRelation: "gefaessmodell"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"gefaessmodell": {
                  Row: {
                    "app_version": string,"betriebsvolumen_l": number,"client_id": string | null,"erfasst_am": string,"form": Database["public"]['Enums']["gefaess_form"],"id": string,"innen_b_mm": number,"innen_h_mm": number,"innen_l_mm": number,"name": string,"nennvolumen_l": number | null,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"betriebsvolumen_l": number,"client_id"?: string | null,"erfasst_am"?: string,"form": Database["public"]['Enums']["gefaess_form"],"id"?: string,"innen_b_mm": number,"innen_h_mm": number,"innen_l_mm": number,"name": string,"nennvolumen_l"?: number | null,"storniert_am"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"betriebsvolumen_l"?: number,"client_id"?: string | null,"erfasst_am"?: string,"form"?: Database["public"]['Enums']["gefaess_form"],"id"?: string,"innen_b_mm"?: number,"innen_h_mm"?: number,"innen_l_mm"?: number,"name"?: string,"nennvolumen_l"?: number | null,"storniert_am"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"herkunft": {
                  Row: {
                    "app_version": string,"erfasst_am": string,"evidenzklasse": Database["public"]['Enums']["evidenzklasse"],"feld": string,"fundstelle": string,"gueltig_ab": string,"gueltig_bis": string | null,"id": string,"kurzzitat": string,"quelle_id": string,"tabelle": string,"vermerk": Database["public"]['Enums']["vermerk"],"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"erfasst_am"?: string,"evidenzklasse": Database["public"]['Enums']["evidenzklasse"],"feld": string,"fundstelle": string,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kurzzitat": string,"quelle_id": string,"tabelle": string,"vermerk"?: Database["public"]['Enums']["vermerk"],"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"erfasst_am"?: string,"evidenzklasse"?: Database["public"]['Enums']["evidenzklasse"],"feld"?: string,"fundstelle"?: string,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kurzzitat"?: string,"quelle_id"?: string,"tabelle"?: string,"vermerk"?: Database["public"]['Enums']["vermerk"],"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "herkunft_quelle_id_fkey"
      columns: ["quelle_id"]
isOneToOne: false
      referencedRelation: "quelle"
      referencedColumns: ["quelle_id"]
    }
                  ]
                },"k_faktor": {
                  Row: {
                    "app_version": string,"client_id": string | null,"erfasst_am": string,"gilt_ab": string,"id": string,"produkt_id": string,"quelle": Database["public"]['Enums']["k_quelle"],"storniert_am": string | null,"wert": number
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"client_id"?: string | null,"erfasst_am"?: string,"gilt_ab": string,"id"?: string,"produkt_id": string,"quelle": Database["public"]['Enums']["k_quelle"],"storniert_am"?: string | null,"wert": number
                  }
                  Update: {
                    "app_version"?: string,"client_id"?: string | null,"erfasst_am"?: string,"gilt_ab"?: string,"id"?: string,"produkt_id"?: string,"quelle"?: Database["public"]['Enums']["k_quelle"],"storniert_am"?: string | null,"wert"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "k_faktor_produkt_id_fkey"
      columns: ["produkt_id"]
isOneToOne: false
      referencedRelation: "produkt"
      referencedColumns: ["produkt_id"]
    }
                  ]
                },"kalibrierung": {
                  Row: {
                    "app_version": string,"aufgabe_schluessel": string | null,"client_id": string,"client_zeit": string | null,"datenart": Database["public"]['Enums']["datenart"],"dauer_s": number | null,"erfasst_am": string,"ersetzt_id": string | null,"gegenprobe_ec": number | null,"gilt_ab": string,"id": string,"loesung_geoeffnet_am": string | null,"loesungen": (string)[],"messgeraet_id": string,"nach_reinigung": boolean,"nacherfasst": boolean | null,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null,"war_faellig_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"aufgabe_schluessel"?: string | null,"client_id": string,"client_zeit"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"],"dauer_s"?: number | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gegenprobe_ec"?: number | null,"gilt_ab": string,"id"?: string,"loesung_geoeffnet_am"?: string | null,"loesungen"?: (string)[],"messgeraet_id": string,"nach_reinigung"?: boolean,"nacherfasst"?: never,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"war_faellig_am"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"aufgabe_schluessel"?: string | null,"client_id"?: string,"client_zeit"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"],"dauer_s"?: number | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gegenprobe_ec"?: number | null,"gilt_ab"?: string,"id"?: string,"loesung_geoeffnet_am"?: string | null,"loesungen"?: (string)[],"messgeraet_id"?: string,"nach_reinigung"?: boolean,"nacherfasst"?: never,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"war_faellig_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "kalibrierung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "kalibrierung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kalibrierung_messgeraet_id_fkey"
      columns: ["messgeraet_id"]
isOneToOne: false
      referencedRelation: "messgeraet"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kalibrierung_messgeraet_id_fkey"
      columns: ["messgeraet_id"]
isOneToOne: false
      referencedRelation: "v_kalibrierung_faellig"
      referencedColumns: ["messgeraet_id"]
    }
                  ]
                },"ki_aufruf": {
                  Row: {
                    "app_version": string,"dauer_ms": number | null,"erfasst_am": string,"id": string,"modell": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"dauer_ms"?: number | null,"erfasst_am"?: string,"id"?: string,"modell": string,"status": string
                  }
                  Update: {
                    "app_version"?: string,"dauer_ms"?: number | null,"erfasst_am"?: string,"id"?: string,"modell"?: string,"status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ki_feldprotokoll": {
                  Row: {
                    "app_version": string,"bewertung_eval": Database["public"]['Enums']["ki_bewertung"] | null,"client_id": string,"datenart": Database["public"]['Enums']["datenart"],"dauer_ms": number | null,"erfasst_am": string,"feld": Database["public"]['Enums']["ki_feld"],"fotopfad": string | null,"id": string,"modell": string,"saatgut_id": string | null,"sorte_id": string | null,"status": Database["public"]['Enums']["ki_status"],"storniert_am": string | null,"wert_final": string | null,"wert_ki": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"bewertung_eval"?: Database["public"]['Enums']["ki_bewertung"] | null,"client_id": string,"datenart"?: Database["public"]['Enums']["datenart"],"dauer_ms"?: number | null,"erfasst_am"?: string,"feld": Database["public"]['Enums']["ki_feld"],"fotopfad"?: string | null,"id"?: string,"modell": string,"saatgut_id"?: string | null,"sorte_id"?: string | null,"status": Database["public"]['Enums']["ki_status"],"storniert_am"?: string | null,"wert_final"?: string | null,"wert_ki"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"bewertung_eval"?: Database["public"]['Enums']["ki_bewertung"] | null,"client_id"?: string,"datenart"?: Database["public"]['Enums']["datenart"],"dauer_ms"?: number | null,"erfasst_am"?: string,"feld"?: Database["public"]['Enums']["ki_feld"],"fotopfad"?: string | null,"id"?: string,"modell"?: string,"saatgut_id"?: string | null,"sorte_id"?: string | null,"status"?: Database["public"]['Enums']["ki_status"],"storniert_am"?: string | null,"wert_final"?: string | null,"wert_ki"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ki_feldprotokoll_saatgut_id_fkey"
      columns: ["saatgut_id"]
isOneToOne: false
      referencedRelation: "saatgut"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ki_feldprotokoll_saatgut_id_fkey"
      columns: ["saatgut_id"]
isOneToOne: false
      referencedRelation: "v_keimrate"
      referencedColumns: ["saatgut_id"]
    },{
      foreignKeyName: "ki_feldprotokoll_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"kulturform_profilende": {
                  Row: {
                    "app_version": string,"erfasst_am": string,"id": string,"kulturform": Database["public"]['Enums']["kulturform"],"profil_ende": Database["public"]['Enums']["phase"]
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"erfasst_am"?: string,"id"?: string,"kulturform": Database["public"]['Enums']["kulturform"],"profil_ende": Database["public"]['Enums']["phase"]
                  }
                  Update: {
                    "app_version"?: string,"erfasst_am"?: string,"id"?: string,"kulturform"?: Database["public"]['Enums']["kulturform"],"profil_ende"?: Database["public"]['Enums']["phase"]
                  }
                  Relationships: [
                    
                  ]
                },"kulturgruppe": {
                  Row: {
                    "app_version": string,"ec_obergrenze_validator": number,"erfasst_am": string,"freigegeben_am": string | null,"id": string,"kulturgruppe_id": string,"leitkultur_art_id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"ec_obergrenze_validator": number,"erfasst_am"?: string,"freigegeben_am"?: string | null,"id"?: string,"kulturgruppe_id": string,"leitkultur_art_id": string,"name": string
                  }
                  Update: {
                    "app_version"?: string,"ec_obergrenze_validator"?: number,"erfasst_am"?: string,"freigegeben_am"?: string | null,"id"?: string,"kulturgruppe_id"?: string,"leitkultur_art_id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "kulturgruppe_leitkultur_art_id_fkey"
      columns: ["leitkultur_art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    }
                  ]
                },"messgeraet": {
                  Row: {
                    "app_version": string,"dezimalen": number,"einheit": string,"erfasst_am": string,"id": string,"messbereich": string | null,"modell": string,"u_ec": number,"u_ph": number
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"dezimalen"?: number,"einheit"?: string,"erfasst_am"?: string,"id"?: string,"messbereich"?: string | null,"modell": string,"u_ec"?: number,"u_ph"?: number
                  }
                  Update: {
                    "app_version"?: string,"dezimalen"?: number,"einheit"?: string,"erfasst_am"?: string,"id"?: string,"messbereich"?: string | null,"modell"?: string,"u_ec"?: number,"u_ph"?: number
                  }
                  Relationships: [
                    
                  ]
                },"messung": {
                  Row: {
                    "ansatz_id": string | null,"app_version": string,"aufgabe_schluessel": string | null,"bewertung_ec": Database["public"]['Enums']["bewertung"] | null,"bewertung_ph": Database["public"]['Enums']["bewertung"] | null,"bewertung_temp": Database["public"]['Enums']["bewertung"] | null,"client_id": string,"client_zeit": string | null,"datenart": Database["public"]['Enums']["datenart"] | null,"ec": number | null,"ec_dezimalen": number | null,"ec_eingabe": string | null,"erfasst_am": string,"erfassungsdauer_s": number | null,"ersetzt_id": string | null,"fuellhoehe_mm": number | null,"fuellstand": Database["public"]['Enums']["fuellstand"] | null,"gilt_ab": string,"id": string,"messart": Database["public"]['Enums']["messart"],"messgeraet_id": string,"nacherfasst": boolean | null,"ph": number | null,"platz_id": string | null,"schnappschuss": NonNullable<Json>,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null,"temperatur": number | null,"war_faellig_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ansatz_id"?: string | null,"app_version": string,"aufgabe_schluessel"?: string | null,"bewertung_ec"?: Database["public"]['Enums']["bewertung"] | null,"bewertung_ph"?: Database["public"]['Enums']["bewertung"] | null,"bewertung_temp"?: Database["public"]['Enums']["bewertung"] | null,"client_id": string,"client_zeit"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"] | null,"ec"?: number | null,"ec_dezimalen"?: number | null,"ec_eingabe"?: string | null,"erfasst_am"?: string,"erfassungsdauer_s"?: number | null,"ersetzt_id"?: string | null,"fuellhoehe_mm"?: number | null,"fuellstand"?: Database["public"]['Enums']["fuellstand"] | null,"gilt_ab": string,"id"?: string,"messart": Database["public"]['Enums']["messart"],"messgeraet_id": string,"nacherfasst"?: never,"ph"?: number | null,"platz_id"?: string | null,"schnappschuss"?: NonNullable<Json>,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"temperatur"?: number | null,"war_faellig_am"?: string | null
                  }
                  Update: {
                    "ansatz_id"?: string | null,"app_version"?: string,"aufgabe_schluessel"?: string | null,"bewertung_ec"?: Database["public"]['Enums']["bewertung"] | null,"bewertung_ph"?: Database["public"]['Enums']["bewertung"] | null,"bewertung_temp"?: Database["public"]['Enums']["bewertung"] | null,"client_id"?: string,"client_zeit"?: string | null,"datenart"?: Database["public"]['Enums']["datenart"] | null,"ec"?: number | null,"ec_dezimalen"?: number | null,"ec_eingabe"?: string | null,"erfasst_am"?: string,"erfassungsdauer_s"?: number | null,"ersetzt_id"?: string | null,"fuellhoehe_mm"?: number | null,"fuellstand"?: Database["public"]['Enums']["fuellstand"] | null,"gilt_ab"?: string,"id"?: string,"messart"?: Database["public"]['Enums']["messart"],"messgeraet_id"?: string,"nacherfasst"?: never,"ph"?: number | null,"platz_id"?: string | null,"schnappschuss"?: NonNullable<Json>,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"temperatur"?: number | null,"war_faellig_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messung_ansatz_fk"
      columns: ["ansatz_id"]
isOneToOne: false
      referencedRelation: "naehrloesungsansatz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "messung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "v_messung_unsicher"
      referencedColumns: ["messung_id"]
    },{
      foreignKeyName: "messung_messgeraet_id_fkey"
      columns: ["messgeraet_id"]
isOneToOne: false
      referencedRelation: "messgeraet"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messung_messgeraet_id_fkey"
      columns: ["messgeraet_id"]
isOneToOne: false
      referencedRelation: "v_kalibrierung_faellig"
      referencedColumns: ["messgeraet_id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"naehrloesungsansatz": {
                  Row: {
                    "abgeschlossen_am": string | null,"app_version": string,"aufgabe_schluessel": string | null,"begonnen_am": string,"client_id": string,"client_zeit": string | null,"dauer_s": number | null,"dosis_hersteller_ml_l": number | null,"dosis_verwendet_ml_l": number | null,"ec_erwartet_final": number | null,"ec_erwartet_teildosis": number | null,"ec_wasser": number | null,"endmessung_id": string | null,"erfasst_am": string,"ersetzt_id": string | null,"gerechnet_fuer": (string)[],"gilt_ab": string,"id": string,"ist_ersteinstellung": boolean,"k_uebernommen": boolean | null,"k_vorschlag": number | null,"kontrollmessung_id": string | null,"leitkultur_art_id": string | null,"mischentscheid": Database["public"]['Enums']["mischentscheid"],"nacherfasst": boolean | null,"nachgefuellt_l": number | null,"ph_nachher": number | null,"ph_vorher": number | null,"platz_id": string,"schnappschuss": NonNullable<Json>,"skaliert": boolean | null,"stadium_gewaehlt": Database["public"]['Enums']["stadium"] | null,"stadium_vorschlag": Database["public"]['Enums']["stadium"] | null,"status": Database["public"]['Enums']["ansatz_status"],"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null,"teil_dosis": number | null,"timer_ende": string | null,"typ": Database["public"]['Enums']["ansatz_typ"],"ueber_herstellerdosis_bestaetigt": boolean,"volumen_l": number,"war_faellig_am": string | null,"ziel_ec_gewaehlt": number | null,"ziel_ec_vorschlag": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "abgeschlossen_am"?: string | null,"app_version": string,"aufgabe_schluessel"?: string | null,"begonnen_am": string,"client_id": string,"client_zeit"?: string | null,"dauer_s"?: number | null,"dosis_hersteller_ml_l"?: number | null,"dosis_verwendet_ml_l"?: number | null,"ec_erwartet_final"?: number | null,"ec_erwartet_teildosis"?: number | null,"ec_wasser"?: number | null,"endmessung_id"?: string | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gerechnet_fuer"?: (string)[],"gilt_ab": string,"id"?: string,"ist_ersteinstellung"?: boolean,"k_uebernommen"?: boolean | null,"k_vorschlag"?: number | null,"kontrollmessung_id"?: string | null,"leitkultur_art_id"?: string | null,"mischentscheid"?: Database["public"]['Enums']["mischentscheid"],"nacherfasst"?: never,"nachgefuellt_l"?: number | null,"ph_nachher"?: number | null,"ph_vorher"?: number | null,"platz_id": string,"schnappschuss"?: NonNullable<Json>,"skaliert"?: boolean | null,"stadium_gewaehlt"?: Database["public"]['Enums']["stadium"] | null,"stadium_vorschlag"?: Database["public"]['Enums']["stadium"] | null,"status"?: Database["public"]['Enums']["ansatz_status"],"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"teil_dosis"?: number | null,"timer_ende"?: string | null,"typ": Database["public"]['Enums']["ansatz_typ"],"ueber_herstellerdosis_bestaetigt"?: boolean,"volumen_l": number,"war_faellig_am"?: string | null,"ziel_ec_gewaehlt"?: number | null,"ziel_ec_vorschlag"?: number | null
                  }
                  Update: {
                    "abgeschlossen_am"?: string | null,"app_version"?: string,"aufgabe_schluessel"?: string | null,"begonnen_am"?: string,"client_id"?: string,"client_zeit"?: string | null,"dauer_s"?: number | null,"dosis_hersteller_ml_l"?: number | null,"dosis_verwendet_ml_l"?: number | null,"ec_erwartet_final"?: number | null,"ec_erwartet_teildosis"?: number | null,"ec_wasser"?: number | null,"endmessung_id"?: string | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gerechnet_fuer"?: (string)[],"gilt_ab"?: string,"id"?: string,"ist_ersteinstellung"?: boolean,"k_uebernommen"?: boolean | null,"k_vorschlag"?: number | null,"kontrollmessung_id"?: string | null,"leitkultur_art_id"?: string | null,"mischentscheid"?: Database["public"]['Enums']["mischentscheid"],"nacherfasst"?: never,"nachgefuellt_l"?: number | null,"ph_nachher"?: number | null,"ph_vorher"?: number | null,"platz_id"?: string,"schnappschuss"?: NonNullable<Json>,"skaliert"?: boolean | null,"stadium_gewaehlt"?: Database["public"]['Enums']["stadium"] | null,"stadium_vorschlag"?: Database["public"]['Enums']["stadium"] | null,"status"?: Database["public"]['Enums']["ansatz_status"],"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"teil_dosis"?: number | null,"timer_ende"?: string | null,"typ"?: Database["public"]['Enums']["ansatz_typ"],"ueber_herstellerdosis_bestaetigt"?: boolean,"volumen_l"?: number,"war_faellig_am"?: string | null,"ziel_ec_gewaehlt"?: number | null,"ziel_ec_vorschlag"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "naehrloesungsansatz_endmessung_id_fkey"
      columns: ["endmessung_id"]
isOneToOne: false
      referencedRelation: "messung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "naehrloesungsansatz_endmessung_id_fkey"
      columns: ["endmessung_id"]
isOneToOne: false
      referencedRelation: "v_messung_unsicher"
      referencedColumns: ["messung_id"]
    },{
      foreignKeyName: "naehrloesungsansatz_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "naehrloesungsansatz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "naehrloesungsansatz_kontrollmessung_id_fkey"
      columns: ["kontrollmessung_id"]
isOneToOne: false
      referencedRelation: "messung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "naehrloesungsansatz_kontrollmessung_id_fkey"
      columns: ["kontrollmessung_id"]
isOneToOne: false
      referencedRelation: "v_messung_unsicher"
      referencedColumns: ["messung_id"]
    },{
      foreignKeyName: "naehrloesungsansatz_leitkultur_art_id_fkey"
      columns: ["leitkultur_art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    },{
      foreignKeyName: "naehrloesungsansatz_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "naehrloesungsansatz_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "naehrloesungsansatz_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "naehrloesungsansatz_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "naehrloesungsansatz_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"netztopf": {
                  Row: {
                    "aktiv": boolean,"anlage_id": string,"app_version": string,"client_id": string | null,"erfasst_am": string,"groesse_mm": number,"heim_loch_nr": number,"heim_platz_id": string,"id": string,"kennung": string,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aktiv"?: boolean,"anlage_id": string,"app_version": string,"client_id"?: string | null,"erfasst_am"?: string,"groesse_mm": number,"heim_loch_nr": number,"heim_platz_id": string,"id"?: string,"kennung": string,"storniert_am"?: string | null
                  }
                  Update: {
                    "aktiv"?: boolean,"anlage_id"?: string,"app_version"?: string,"client_id"?: string | null,"erfasst_am"?: string,"groesse_mm"?: number,"heim_loch_nr"?: number,"heim_platz_id"?: string,"id"?: string,"kennung"?: string,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "netztopf_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "anlage"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "netztopf_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_ec_wasser"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "netztopf_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_saeurebedarf"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "netztopf_heim_platz_id_fkey"
      columns: ["heim_platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "netztopf_heim_platz_id_fkey"
      columns: ["heim_platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "netztopf_heim_platz_id_fkey"
      columns: ["heim_platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "netztopf_heim_platz_id_fkey"
      columns: ["heim_platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "netztopf_heim_platz_id_fkey"
      columns: ["heim_platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"pflanzung": {
                  Row: {
                    "app_version": string,"client_id": string,"client_zeit": string | null,"einstufung": Database["public"]['Enums']["einstufung"] | null,"erfasst_am": string,"ersetzt_id": string | null,"gilt_ab": string,"gruende": (string)[],"id": string,"nacherfasst": boolean | null,"pflanzvorgang_id": string | null,"rang": number | null,"satz_id": string,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"client_id": string,"client_zeit"?: string | null,"einstufung"?: Database["public"]['Enums']["einstufung"] | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab": string,"gruende"?: (string)[],"id"?: string,"nacherfasst"?: never,"pflanzvorgang_id"?: string | null,"rang"?: number | null,"satz_id": string,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null
                  }
                  Update: {
                    "app_version"?: string,"client_id"?: string,"client_zeit"?: string | null,"einstufung"?: Database["public"]['Enums']["einstufung"] | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab"?: string,"gruende"?: (string)[],"id"?: string,"nacherfasst"?: never,"pflanzvorgang_id"?: string | null,"rang"?: number | null,"satz_id"?: string,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pflanzung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "pflanzung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pflanzung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "v_pflanzung_zustand"
      referencedColumns: ["pflanzung_id"]
    },{
      foreignKeyName: "pflanzung_pflanzvorgang_id_fkey"
      columns: ["pflanzvorgang_id"]
isOneToOne: false
      referencedRelation: "pflanzvorgang"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pflanzung_satz_id_fkey"
      columns: ["satz_id"]
isOneToOne: false
      referencedRelation: "satz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pflanzung_satz_id_fkey"
      columns: ["satz_id"]
isOneToOne: false
      referencedRelation: "v_folgesatz"
      referencedColumns: ["satz_id"]
    }
                  ]
                },"pflanzvorgang": {
                  Row: {
                    "anzahl_pflanzungen": number,"app_version": string,"begonnen_am": string,"client_id": string,"dauer_s": number | null,"einstieg": Database["public"]['Enums']["pflanzvorgang_einstieg"],"erfasst_am": string,"gespeichert_am": string,"id": string,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anzahl_pflanzungen": number,"app_version": string,"begonnen_am": string,"client_id": string,"dauer_s"?: never,"einstieg": Database["public"]['Enums']["pflanzvorgang_einstieg"],"erfasst_am"?: string,"gespeichert_am": string,"id"?: string,"storniert_am"?: string | null
                  }
                  Update: {
                    "anzahl_pflanzungen"?: number,"app_version"?: string,"begonnen_am"?: string,"client_id"?: string,"dauer_s"?: never,"einstieg"?: Database["public"]['Enums']["pflanzvorgang_einstieg"],"erfasst_am"?: string,"gespeichert_am"?: string,"id"?: string,"storniert_am"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"pflichtgroesse": {
                  Row: {
                    "app_version": string,"erfasst_am": string,"groesse": Database["public"]['Enums']["groesse"],"id": string,"mindestens_art": boolean,"phase": Database["public"]['Enums']["phase"]
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"erfasst_am"?: string,"groesse": Database["public"]['Enums']["groesse"],"id"?: string,"mindestens_art"?: boolean,"phase": Database["public"]['Enums']["phase"]
                  }
                  Update: {
                    "app_version"?: string,"erfasst_am"?: string,"groesse"?: Database["public"]['Enums']["groesse"],"id"?: string,"mindestens_art"?: boolean,"phase"?: Database["public"]['Enums']["phase"]
                  }
                  Relationships: [
                    
                  ]
                },"platz": {
                  Row: {
                    "aktiv": boolean,"anlage_id": string,"app_version": string,"bereich_id": string | null,"client_id": string | null,"erfasst_am": string,"id": string,"kennung": string,"position": number | null,"rolle": Database["public"]['Enums']["platz_rolle"],"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aktiv"?: boolean,"anlage_id": string,"app_version": string,"bereich_id"?: string | null,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"kennung": string,"position"?: number | null,"rolle": Database["public"]['Enums']["platz_rolle"],"storniert_am"?: string | null
                  }
                  Update: {
                    "aktiv"?: boolean,"anlage_id"?: string,"app_version"?: string,"bereich_id"?: string | null,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"kennung"?: string,"position"?: number | null,"rolle"?: Database["public"]['Enums']["platz_rolle"],"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "platz_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "anlage"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "platz_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_ec_wasser"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "platz_anlage_id_fkey"
      columns: ["anlage_id"]
isOneToOne: false
      referencedRelation: "v_saeurebedarf"
      referencedColumns: ["anlage_id"]
    },{
      foreignKeyName: "platz_bereich_id_fkey"
      columns: ["bereich_id"]
isOneToOne: false
      referencedRelation: "bereich"
      referencedColumns: ["id"]
    }
                  ]
                },"produkt": {
                  Row: {
                    "app_version": string,"erfasst_am": string,"gehalt": string | null,"id": string,"konzentration": string | null,"name": string,"produkt_id": string,"variante": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"erfasst_am"?: string,"gehalt"?: string | null,"id"?: string,"konzentration"?: string | null,"name": string,"produkt_id": string,"variante"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"erfasst_am"?: string,"gehalt"?: string | null,"id"?: string,"konzentration"?: string | null,"name"?: string,"produkt_id"?: string,"variante"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"profilwert": {
                  Row: {
                    "app_version": string,"art_id": string | null,"bezugs_dli": number | null,"bezugstemperatur_c": number | null,"commit": string,"ebene": Database["public"]['Enums']["profil_ebene"],"ec_basis_quelle": Database["public"]['Enums']["ec_basis"] | null,"ec_einheit_quelle": Database["public"]['Enums']["ec_einheit"] | null,"ec_max_quelle": number | null,"ec_min_quelle": number | null,"erfasst_am": string,"evidenzklasse": Database["public"]['Enums']["evidenzklasse"],"freigegeben_am": string | null,"fundstelle": string,"groesse": Database["public"]['Enums']["groesse"],"gueltig_ab": string,"gueltig_bis": string | null,"id": string,"kulturgruppe_id": string | null,"kurzzitat": string,"phase": Database["public"]['Enums']["phase"],"quelldatei": string,"quelle_id": string,"sorte_id": string | null,"system_quelle": Database["public"]['Enums']["system"] | null,"text_wert": string | null,"umgebung_quelle": Database["public"]['Enums']["umgebung"] | null,"vermerk": Database["public"]['Enums']["vermerk"],"wert_max": number | null,"wert_min": number | null,"wert_typ": number | null,"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"art_id"?: string | null,"bezugs_dli"?: number | null,"bezugstemperatur_c"?: number | null,"commit": string,"ebene": Database["public"]['Enums']["profil_ebene"],"ec_basis_quelle"?: Database["public"]['Enums']["ec_basis"] | null,"ec_einheit_quelle"?: Database["public"]['Enums']["ec_einheit"] | null,"ec_max_quelle"?: number | null,"ec_min_quelle"?: number | null,"erfasst_am"?: string,"evidenzklasse": Database["public"]['Enums']["evidenzklasse"],"freigegeben_am"?: string | null,"fundstelle": string,"groesse": Database["public"]['Enums']["groesse"],"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturgruppe_id"?: string | null,"kurzzitat": string,"phase": Database["public"]['Enums']["phase"],"quelldatei": string,"quelle_id": string,"sorte_id"?: string | null,"system_quelle"?: Database["public"]['Enums']["system"] | null,"text_wert"?: string | null,"umgebung_quelle"?: Database["public"]['Enums']["umgebung"] | null,"vermerk"?: Database["public"]['Enums']["vermerk"],"wert_max"?: number | null,"wert_min"?: number | null,"wert_typ"?: number | null,"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"art_id"?: string | null,"bezugs_dli"?: number | null,"bezugstemperatur_c"?: number | null,"commit"?: string,"ebene"?: Database["public"]['Enums']["profil_ebene"],"ec_basis_quelle"?: Database["public"]['Enums']["ec_basis"] | null,"ec_einheit_quelle"?: Database["public"]['Enums']["ec_einheit"] | null,"ec_max_quelle"?: number | null,"ec_min_quelle"?: number | null,"erfasst_am"?: string,"evidenzklasse"?: Database["public"]['Enums']["evidenzklasse"],"freigegeben_am"?: string | null,"fundstelle"?: string,"groesse"?: Database["public"]['Enums']["groesse"],"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturgruppe_id"?: string | null,"kurzzitat"?: string,"phase"?: Database["public"]['Enums']["phase"],"quelldatei"?: string,"quelle_id"?: string,"sorte_id"?: string | null,"system_quelle"?: Database["public"]['Enums']["system"] | null,"text_wert"?: string | null,"umgebung_quelle"?: Database["public"]['Enums']["umgebung"] | null,"vermerk"?: Database["public"]['Enums']["vermerk"],"wert_max"?: number | null,"wert_min"?: number | null,"wert_typ"?: number | null,"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profilwert_art_id_fkey"
      columns: ["art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    },{
      foreignKeyName: "profilwert_kulturgruppe_id_fkey"
      columns: ["kulturgruppe_id"]
isOneToOne: false
      referencedRelation: "kulturgruppe"
      referencedColumns: ["kulturgruppe_id"]
    },{
      foreignKeyName: "profilwert_quelle_id_fkey"
      columns: ["quelle_id"]
isOneToOne: false
      referencedRelation: "quelle"
      referencedColumns: ["quelle_id"]
    },{
      foreignKeyName: "profilwert_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"push_abo": {
                  Row: {
                    "aktiv": boolean,"app_version": string,"auth_schluessel": string,"datenart": Database["public"]['Enums']["datenart"],"endpoint": string,"erfasst_am": string,"geraet": string,"id": string,"letzter_fehler": string | null,"p256dh": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aktiv"?: boolean,"app_version": string,"auth_schluessel": string,"datenart"?: Database["public"]['Enums']["datenart"],"endpoint": string,"erfasst_am"?: string,"geraet": string,"id"?: string,"letzter_fehler"?: string | null,"p256dh": string
                  }
                  Update: {
                    "aktiv"?: boolean,"app_version"?: string,"auth_schluessel"?: string,"datenart"?: Database["public"]['Enums']["datenart"],"endpoint"?: string,"erfasst_am"?: string,"geraet"?: string,"id"?: string,"letzter_fehler"?: string | null,"p256dh"?: string
                  }
                  Relationships: [
                    
                  ]
                },"push_versand": {
                  Row: {
                    "abo_id": string | null,"angezeigt_am": string | null,"anzahl_aufgaben": number | null,"app_version": string,"art": Database["public"]['Enums']["push_art"],"bezug_id": string | null,"datum_lokal": string,"erfasst_am": string,"geoeffnet_am": string | null,"gesendet_am": string | null,"id": string,"kanal": Database["public"]['Enums']["push_kanal"],"status": Database["public"]['Enums']["push_status"],"timer_ende": string | null,"titel": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "abo_id"?: string | null,"angezeigt_am"?: string | null,"anzahl_aufgaben"?: number | null,"app_version": string,"art": Database["public"]['Enums']["push_art"],"bezug_id"?: string | null,"datum_lokal": string,"erfasst_am"?: string,"geoeffnet_am"?: string | null,"gesendet_am"?: string | null,"id"?: string,"kanal": Database["public"]['Enums']["push_kanal"],"status"?: Database["public"]['Enums']["push_status"],"timer_ende"?: string | null,"titel"?: string | null
                  }
                  Update: {
                    "abo_id"?: string | null,"angezeigt_am"?: string | null,"anzahl_aufgaben"?: number | null,"app_version"?: string,"art"?: Database["public"]['Enums']["push_art"],"bezug_id"?: string | null,"datum_lokal"?: string,"erfasst_am"?: string,"geoeffnet_am"?: string | null,"gesendet_am"?: string | null,"id"?: string,"kanal"?: Database["public"]['Enums']["push_kanal"],"status"?: Database["public"]['Enums']["push_status"],"timer_ende"?: string | null,"titel"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_versand_abo_id_fkey"
      columns: ["abo_id"]
isOneToOne: false
      referencedRelation: "push_abo"
      referencedColumns: ["id"]
    }
                  ]
                },"quelle": {
                  Row: {
                    "abgerufen_am": string | null,"anbaumethode": Database["public"]['Enums']["system"],"app_version": string,"autoren": string | null,"erfasst_am": string,"freigegeben_am": string | null,"id": string,"jahr": number | null,"klasse": Database["public"]['Enums']["quelle_klasse"],"link": string,"quelle_id": string,"titel": string
                  }
                  ComputedFields: never
                  Insert: {
                    "abgerufen_am"?: string | null,"anbaumethode": Database["public"]['Enums']["system"],"app_version": string,"autoren"?: string | null,"erfasst_am"?: string,"freigegeben_am"?: string | null,"id"?: string,"jahr"?: number | null,"klasse": Database["public"]['Enums']["quelle_klasse"],"link": string,"quelle_id": string,"titel": string
                  }
                  Update: {
                    "abgerufen_am"?: string | null,"anbaumethode"?: Database["public"]['Enums']["system"],"app_version"?: string,"autoren"?: string | null,"erfasst_am"?: string,"freigegeben_am"?: string | null,"id"?: string,"jahr"?: number | null,"klasse"?: Database["public"]['Enums']["quelle_klasse"],"link"?: string,"quelle_id"?: string,"titel"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reservierung": {
                  Row: {
                    "app_version": string,"client_id": string,"client_zeit": string | null,"erfasst_am": string,"ersetzt_id": string | null,"gilt_ab": string,"id": string,"nacherfasst": boolean | null,"netztopf_id": string,"pflanzung_id": string,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null,"umsetzen_geplant_am": string,"umsetzen_vorgabe_am": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"client_id": string,"client_zeit"?: string | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab": string,"id"?: string,"nacherfasst"?: never,"netztopf_id": string,"pflanzung_id": string,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"umsetzen_geplant_am": string,"umsetzen_vorgabe_am": string
                  }
                  Update: {
                    "app_version"?: string,"client_id"?: string,"client_zeit"?: string | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab"?: string,"id"?: string,"nacherfasst"?: never,"netztopf_id"?: string,"pflanzung_id"?: string,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"umsetzen_geplant_am"?: string,"umsetzen_vorgabe_am"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reservierung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "reservierung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "v_reservierung_aktiv"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "netztopf"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "v_netztopf_platz"
      referencedColumns: ["netztopf_id"]
    },{
      foreignKeyName: "reservierung_pflanzung_id_fkey"
      columns: ["pflanzung_id"]
isOneToOne: false
      referencedRelation: "pflanzung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_pflanzung_id_fkey"
      columns: ["pflanzung_id"]
isOneToOne: false
      referencedRelation: "v_pflanzung_zustand"
      referencedColumns: ["pflanzung_id"]
    }
                  ]
                },"saatempfehlung": {
                  Row: {
                    "app_version": string,"art_id": string | null,"begruendung": string,"bestaetigt_am": string | null,"commit": string,"ebene": Database["public"]['Enums']["profil_ebene"],"erfasst_am": string,"freigegeben_am": string | null,"fundstelle": string | null,"gueltig_ab": string,"gueltig_bis": string | null,"id": string,"klasse_saatmenge": Database["public"]['Enums']["klasse_saatmenge"],"kulturform": Database["public"]['Enums']["kulturform"],"kurzzitat": string | null,"obergrenze_samen": number,"pflanzen_stehen_lassen": number,"quelldatei": string,"quelle_id": string | null,"samen_je_schwamm": number,"sorte_id": string | null,"substrat_passung": string | null,"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"art_id"?: string | null,"begruendung": string,"bestaetigt_am"?: string | null,"commit": string,"ebene": Database["public"]['Enums']["profil_ebene"],"erfasst_am"?: string,"freigegeben_am"?: string | null,"fundstelle"?: string | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"klasse_saatmenge": Database["public"]['Enums']["klasse_saatmenge"],"kulturform": Database["public"]['Enums']["kulturform"],"kurzzitat"?: string | null,"obergrenze_samen": number,"pflanzen_stehen_lassen"?: number,"quelldatei": string,"quelle_id"?: string | null,"samen_je_schwamm": number,"sorte_id"?: string | null,"substrat_passung"?: string | null,"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"art_id"?: string | null,"begruendung"?: string,"bestaetigt_am"?: string | null,"commit"?: string,"ebene"?: Database["public"]['Enums']["profil_ebene"],"erfasst_am"?: string,"freigegeben_am"?: string | null,"fundstelle"?: string | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"klasse_saatmenge"?: Database["public"]['Enums']["klasse_saatmenge"],"kulturform"?: Database["public"]['Enums']["kulturform"],"kurzzitat"?: string | null,"obergrenze_samen"?: number,"pflanzen_stehen_lassen"?: number,"quelldatei"?: string,"quelle_id"?: string | null,"samen_je_schwamm"?: number,"sorte_id"?: string | null,"substrat_passung"?: string | null,"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saatempfehlung_art_id_fkey"
      columns: ["art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    },{
      foreignKeyName: "saatempfehlung_quelle_id_fkey"
      columns: ["quelle_id"]
isOneToOne: false
      referencedRelation: "quelle"
      referencedColumns: ["quelle_id"]
    },{
      foreignKeyName: "saatempfehlung_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"saatgut": {
                  Row: {
                    "app_version": string,"bestand_korn": number | null,"client_id": string | null,"erfasst_am": string,"id": string,"kaufdatum": string | null,"keimfaehigkeit_packung": number | null,"sorte_id": string,"storniert_am": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"bestand_korn"?: number | null,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"kaufdatum"?: string | null,"keimfaehigkeit_packung"?: number | null,"sorte_id": string,"storniert_am"?: string | null
                  }
                  Update: {
                    "app_version"?: string,"bestand_korn"?: number | null,"client_id"?: string | null,"erfasst_am"?: string,"id"?: string,"kaufdatum"?: string | null,"keimfaehigkeit_packung"?: number | null,"sorte_id"?: string,"storniert_am"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "saatgut_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"satz": {
                  Row: {
                    "anzahl_schwaemme": number,"anzuchtort_platz_id": string | null,"app_version": string,"client_id": string,"client_zeit": string | null,"direktsaat_platz_id": string | null,"erfasst_am": string,"ersetzt_id": string | null,"gilt_ab": string,"id": string,"kopiert_von": string | null,"kulturform": Database["public"]['Enums']["kulturform"],"nacherfasst": boolean | null,"saatdatum": string,"saatgut_id": string | null,"samen_je_schwamm": number,"samen_vorschlag": number | null,"schwaemme_vorschlag": number | null,"sorte_id": string,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anzahl_schwaemme": number,"anzuchtort_platz_id"?: string | null,"app_version": string,"client_id": string,"client_zeit"?: string | null,"direktsaat_platz_id"?: string | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab": string,"id"?: string,"kopiert_von"?: string | null,"kulturform": Database["public"]['Enums']["kulturform"],"nacherfasst"?: never,"saatdatum": string,"saatgut_id"?: string | null,"samen_je_schwamm": number,"samen_vorschlag"?: number | null,"schwaemme_vorschlag"?: number | null,"sorte_id": string,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null
                  }
                  Update: {
                    "anzahl_schwaemme"?: number,"anzuchtort_platz_id"?: string | null,"app_version"?: string,"client_id"?: string,"client_zeit"?: string | null,"direktsaat_platz_id"?: string | null,"erfasst_am"?: string,"ersetzt_id"?: string | null,"gilt_ab"?: string,"id"?: string,"kopiert_von"?: string | null,"kulturform"?: Database["public"]['Enums']["kulturform"],"nacherfasst"?: never,"saatdatum"?: string,"saatgut_id"?: string | null,"samen_je_schwamm"?: number,"samen_vorschlag"?: number | null,"schwaemme_vorschlag"?: number | null,"sorte_id"?: string,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "satz_anzuchtort_platz_id_fkey"
      columns: ["anzuchtort_platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "satz_anzuchtort_platz_id_fkey"
      columns: ["anzuchtort_platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_anzuchtort_platz_id_fkey"
      columns: ["anzuchtort_platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_anzuchtort_platz_id_fkey"
      columns: ["anzuchtort_platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_anzuchtort_platz_id_fkey"
      columns: ["anzuchtort_platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_direktsaat_platz_id_fkey"
      columns: ["direktsaat_platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "satz_direktsaat_platz_id_fkey"
      columns: ["direktsaat_platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_direktsaat_platz_id_fkey"
      columns: ["direktsaat_platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_direktsaat_platz_id_fkey"
      columns: ["direktsaat_platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_direktsaat_platz_id_fkey"
      columns: ["direktsaat_platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "satz_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "satz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "satz_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "v_folgesatz"
      referencedColumns: ["satz_id"]
    },{
      foreignKeyName: "satz_kopiert_von_fkey"
      columns: ["kopiert_von"]
isOneToOne: false
      referencedRelation: "satz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "satz_kopiert_von_fkey"
      columns: ["kopiert_von"]
isOneToOne: false
      referencedRelation: "v_folgesatz"
      referencedColumns: ["satz_id"]
    },{
      foreignKeyName: "satz_saatgut_id_fkey"
      columns: ["saatgut_id"]
isOneToOne: false
      referencedRelation: "saatgut"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "satz_saatgut_id_fkey"
      columns: ["saatgut_id"]
isOneToOne: false
      referencedRelation: "v_keimrate"
      referencedColumns: ["saatgut_id"]
    },{
      foreignKeyName: "satz_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"sorte": {
                  Row: {
                    "app_version": string,"art_id": string,"commit": string,"erfasst_am": string,"freigegeben_am": string | null,"fruehzeitigkeit_relativ_d": number | null,"gueltig_ab": string,"gueltig_bis": string | null,"id": string,"kulturtyp": Database["public"]['Enums']["kulturtyp"],"name": string,"quelldatei": string,"shop_link": string | null,"sorte_id": string,"wuchsform": Database["public"]['Enums']["wuchsform"] | null,"wuchshoehe_max_mm": number | null,"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"art_id": string,"commit": string,"erfasst_am"?: string,"freigegeben_am"?: string | null,"fruehzeitigkeit_relativ_d"?: number | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturtyp": Database["public"]['Enums']["kulturtyp"],"name": string,"quelldatei": string,"shop_link"?: string | null,"sorte_id": string,"wuchsform"?: Database["public"]['Enums']["wuchsform"] | null,"wuchshoehe_max_mm"?: number | null,"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"art_id"?: string,"commit"?: string,"erfasst_am"?: string,"freigegeben_am"?: string | null,"fruehzeitigkeit_relativ_d"?: number | null,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturtyp"?: Database["public"]['Enums']["kulturtyp"],"name"?: string,"quelldatei"?: string,"shop_link"?: string | null,"sorte_id"?: string,"wuchsform"?: Database["public"]['Enums']["wuchsform"] | null,"wuchshoehe_max_mm"?: number | null,"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sorte_art_id_fkey"
      columns: ["art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    },{
      foreignKeyName: "sorte_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"sorte_schluessel": {
                  Row: {
                    "erfasst_am": string,"id": string,"sorte_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "erfasst_am"?: string,"id"?: string,"sorte_key": string
                  }
                  Update: {
                    "erfasst_am"?: string,"id"?: string,"sorte_key"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wissenseintrag": {
                  Row: {
                    "app_version": string,"art_id": string | null,"commit": string,"ebene": Database["public"]['Enums']["wissen_ebene"],"erfasst_am": string,"evidenzklasse": Database["public"]['Enums']["evidenzklasse"],"freigegeben_am": string | null,"fundstelle": string,"gueltig_ab": string,"gueltig_bis": string | null,"id": string,"kulturgruppe_id": string | null,"kurzzitat": string,"phase": Database["public"]['Enums']["phase"] | null,"quelldatei": string,"quelle_id": string,"text": string,"typ": Database["public"]['Enums']["wissenseintrag_typ"],"zeile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version": string,"art_id"?: string | null,"commit": string,"ebene": Database["public"]['Enums']["wissen_ebene"],"erfasst_am"?: string,"evidenzklasse": Database["public"]['Enums']["evidenzklasse"],"freigegeben_am"?: string | null,"fundstelle": string,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturgruppe_id"?: string | null,"kurzzitat": string,"phase"?: Database["public"]['Enums']["phase"] | null,"quelldatei": string,"quelle_id": string,"text": string,"typ": Database["public"]['Enums']["wissenseintrag_typ"],"zeile_id": string
                  }
                  Update: {
                    "app_version"?: string,"art_id"?: string | null,"commit"?: string,"ebene"?: Database["public"]['Enums']["wissen_ebene"],"erfasst_am"?: string,"evidenzklasse"?: Database["public"]['Enums']["evidenzklasse"],"freigegeben_am"?: string | null,"fundstelle"?: string,"gueltig_ab"?: string,"gueltig_bis"?: string | null,"id"?: string,"kulturgruppe_id"?: string | null,"kurzzitat"?: string,"phase"?: Database["public"]['Enums']["phase"] | null,"quelldatei"?: string,"quelle_id"?: string,"text"?: string,"typ"?: Database["public"]['Enums']["wissenseintrag_typ"],"zeile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wissenseintrag_art_id_fkey"
      columns: ["art_id"]
isOneToOne: false
      referencedRelation: "art_schluessel"
      referencedColumns: ["art_id"]
    },{
      foreignKeyName: "wissenseintrag_kulturgruppe_id_fkey"
      columns: ["kulturgruppe_id"]
isOneToOne: false
      referencedRelation: "kulturgruppe"
      referencedColumns: ["kulturgruppe_id"]
    },{
      foreignKeyName: "wissenseintrag_quelle_id_fkey"
      columns: ["quelle_id"]
isOneToOne: false
      referencedRelation: "quelle"
      referencedColumns: ["quelle_id"]
    }
                  ]
                },"zugang": {
                  Row: {
                    "app_version": string,"erfasst_am": string,"id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "app_version"?: string,"erfasst_am"?: string,"id"?: string,"user_id": string
                  }
                  Update: {
                    "app_version"?: string,"erfasst_am"?: string,"id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "v_auswertung_platz": {
                  Row: {
                    "platz_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_ec_wasser": {
                  Row: {
                    "anlage_id": string,"ec": number | null,"gemessen_am": string | null,"herkunft": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_ek6_messdauer": {
                  Row: {
                    "anzahl": number | null,"median_s": number | null,"p90_s": number | null,"woche": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_etikett_scans": {
                  Row: {
                    "anzahl": number | null,"ergebnis": Database["public"]['Enums']["etikett_ergebnis"],"woche": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_folgesatz": {
                  Row: {
                    "satz_id": string,"vorsatz_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "satz_id"?: string | null,"vorsatz_id"?: never
                         }
                        Update: {
                           "satz_id"?: string | null,"vorsatz_id"?: never
                         }
                        Relationships: [
                    
                  ]
                },"v_fuellzustand": {
                  Row: {
                    "fuellzustand": string | null,"letzter_ansatz": string | null,"platz_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_gefaess_status": {
                  Row: {
                    "gefaess_id": string,"status": Database["public"]['Enums']["gefaess_status"] | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_kalibrierung_faellig": {
                  Row: {
                    "datenart": Database["public"]['Enums']["datenart"] | null,"faellig_am": string | null,"letzte": string | null,"messgeraet_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_keimdauer": {
                  Row: {
                    "keimdauer_bis_d": number | null,"keimdauer_von_d": number | null,"saatdatum": string,"sorte_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "satz_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"v_keimrate": {
                  Row: {
                    "gekeimt": number | null,"gesaet": number | null,"rate_geglaettet": number | null,"saatgut_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_ki_guete": {
                  Row: {
                    "anzahl": number | null,"bewertung_eval": Database["public"]['Enums']["ki_bewertung"] | null,"feld": Database["public"]['Enums']["ki_feld"]
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_klima": {
                  Row: {
                    "platz_id": string | null,"tag": string | null,"temperatur": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "messung_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"v_leitkultur_gewaehlt": {
                  Row: {
                    "art_id": string | null,"gilt_ab": string,"platz_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "ereignis_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"v_messung_unsicher": {
                  Row: {
                    "messung_id": string,"unsicher": boolean | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_nachfuellsumme": {
                  Row: {
                    "liter": number | null,"platz_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_netztopf_platz": {
                  Row: {
                    "ausser_heim": boolean | null,"kennung": string,"loch_nr": number | null,"netztopf_id": string,"platz_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_pflanzung_zustand": {
                  Row: {
                    "loch_nr": number | null,"netztopf_id": string | null,"pflanzung_id": string,"phase": Database["public"]['Enums']["phase"] | null,"phase_seit": string | null,"platz_id": string | null,"satz_id": string,"status": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "ereignis_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "netztopf"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ereignis_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "v_netztopf_platz"
      referencedColumns: ["netztopf_id"]
    },{
      foreignKeyName: "pflanzung_satz_id_fkey"
      columns: ["satz_id"]
isOneToOne: false
      referencedRelation: "satz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pflanzung_satz_id_fkey"
      columns: ["satz_id"]
isOneToOne: false
      referencedRelation: "v_folgesatz"
      referencedColumns: ["satz_id"]
    }
                  ]
                },"v_pflegezeit": {
                  Row: {
                    "stunden": number | null,"woche": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_ph_wirkung": {
                  Row: {
                    "wirkung_ml_je_l_je_0_1": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_phasenprognose": {
                  Row: {
                    "abweichung_tage": number | null,"kulturform": Database["public"]['Enums']["kulturform"],"phase": string | null,"sorte_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "satz_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"v_rechnerguete": {
                  Row: {
                    "ansaetze": number | null,"k_vorschlaege": number | null,"mittel_abweichung": number | null,"skaliert": boolean | null,"stadium": Database["public"]['Enums']["stadium"] | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_reservierung_aktiv": {
                  Row: {
                    "app_version": string,"client_id": string,"client_zeit": string | null,"erfasst_am": string,"ersetzt_id": string | null,"gilt_ab": string,"id": string,"nacherfasst": boolean | null,"netztopf_id": string,"pflanzung_id": string,"storniert_am": string | null,"storno_grund": Database["public"]['Enums']["storno_grund"] | null,"umsetzen_geplant_am": string,"umsetzen_vorgabe_am": string
                  }
                  ComputedFields: never
                  Insert: {
                           "app_version"?: string | null,"client_id"?: string | null,"client_zeit"?: string | null,"erfasst_am"?: string | null,"ersetzt_id"?: string | null,"gilt_ab"?: string | null,"id"?: string | null,"nacherfasst"?: boolean | null,"netztopf_id"?: string | null,"pflanzung_id"?: string | null,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"umsetzen_geplant_am"?: string | null,"umsetzen_vorgabe_am"?: string | null
                         }
                        Update: {
                           "app_version"?: string | null,"client_id"?: string | null,"client_zeit"?: string | null,"erfasst_am"?: string | null,"ersetzt_id"?: string | null,"gilt_ab"?: string | null,"id"?: string | null,"nacherfasst"?: boolean | null,"netztopf_id"?: string | null,"pflanzung_id"?: string | null,"storniert_am"?: string | null,"storno_grund"?: Database["public"]['Enums']["storno_grund"] | null,"umsetzen_geplant_am"?: string | null,"umsetzen_vorgabe_am"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "reservierung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "reservierung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_ersetzt_id_fkey"
      columns: ["ersetzt_id"]
isOneToOne: false
      referencedRelation: "v_reservierung_aktiv"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "netztopf"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_netztopf_id_fkey"
      columns: ["netztopf_id"]
isOneToOne: false
      referencedRelation: "v_netztopf_platz"
      referencedColumns: ["netztopf_id"]
    },{
      foreignKeyName: "reservierung_pflanzung_id_fkey"
      columns: ["pflanzung_id"]
isOneToOne: false
      referencedRelation: "pflanzung"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservierung_pflanzung_id_fkey"
      columns: ["pflanzung_id"]
isOneToOne: false
      referencedRelation: "v_pflanzung_zustand"
      referencedColumns: ["pflanzung_id"]
    }
                  ]
                },"v_saeurebedarf": {
                  Row: {
                    "anlage_id": string,"ml_je_l": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "anlage_id"?: string | null,"ml_je_l"?: never
                         }
                        Update: {
                           "anlage_id"?: string | null,"ml_je_l"?: never
                         }
                        Relationships: [
                    
                  ]
                },"v_sollbereichsquote": {
                  Row: {
                    "anzahl": number | null,"betriebsart": string | null,"bewertung": Database["public"]['Enums']["bewertung"] | null,"messgroesse": string | null,"unsicher": boolean | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_sollwert": {
                  Row: {
                    "ec_basis_quelle": Database["public"]['Enums']["ec_basis"] | null,"evidenzklasse": string | null,"groesse": Database["public"]['Enums']["groesse"],"herkunft_ebene": Database["public"]['Enums']["profil_ebene"],"phase": Database["public"]['Enums']["phase"],"quelle_id": string,"sorte_id": string,"text_wert": string | null,"vermerk": Database["public"]['Enums']["vermerk"],"wert_max": number | null,"wert_min": number | null,"wert_typ": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "profilwert_quelle_id_fkey"
      columns: ["quelle_id"]
isOneToOne: false
      referencedRelation: "quelle"
      referencedColumns: ["quelle_id"]
    },{
      foreignKeyName: "sorte_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"v_station_frei": {
                  Row: {
                    "frei_heute": number | null,"groesse_mm": number,"loecher": number | null,"platz_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "platz"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_auswertung_platz"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_fuellzustand"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_nachfuellsumme"
      referencedColumns: ["platz_id"]
    },{
      foreignKeyName: "gefaess_platz_id_fkey"
      columns: ["platz_id"]
isOneToOne: false
      referencedRelation: "v_zielbereich"
      referencedColumns: ["platz_id"]
    }
                  ]
                },"v_termintreue": {
                  Row: {
                    "erledigt_bis_folgetag": number | null,"faellig": number | null,"tag": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_uebersteuerungen": {
                  Row: {
                    "anzahl": number | null,"art": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_vollstaendigkeit": {
                  Row: {
                    "fehlende_groessen": number | null,"pruefauftraege": number | null,"sorte_id": string,"vollstaendig": boolean | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "sorte_sorte_id_fkey"
      columns: ["sorte_id"]
isOneToOne: false
      referencedRelation: "sorte_schluessel"
      referencedColumns: ["id"]
    }
                  ]
                },"v_zielbereich": {
                  Row: {
                    "ec_max": number | null,"ec_min": number | null,"ph_max": number | null,"ph_min": number | null,"platz_id": string,"temp_max": number | null,"temp_min": number | null,"zaehlende_pflanzungen": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "backup_status_melden":
{ Args: { "groesse": number }; Returns: undefined
                           },
"datenart_loeschen":
{ Args: { "art": Database["public"]['Enums']["datenart"] }; Returns: undefined
                           },
"ec_gesamt":
{ Args: { "basis": Database["public"]['Enums']["ec_basis"],"ec_wasser": number,"wert": number }; Returns: number
                           },
"ist_tim":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"kalendertag":
{ Args: { "ts": string }; Returns: string
                           },
"topf_neu_beschriften":
{ Args: { "a": string,"b": string }; Returns: undefined
                           },
"wissen_app_schreiben":
{ Args: { "aktion": string,"daten": Json }; Returns: string
                           }
          }
          Enums: {
            "ansatz_schritt_typ": "kalibrierung_pruefen"|"absaugen"|"frischwasser"|"frischwasser_messen"|"gerechnet_fuer"|"micro"|"spuelen"|"grow"|"bloom"|"umruehren"|"timer"|"ph_einstellen"|"kontrollmessung"|"restdosis"|"endmessung","ansatz_status": "laufend"|"abgeschlossen"|"abgebrochen","ansatz_typ": "neuansatz"|"nachfuellen"|"ph_korrektur"|"teilwechsel","anzuchtort_typ": "box_licht"|"box_dunkel","aufschub_art": "morgen"|"ueberspringen"|"pegel_ok","betriebsart": "dwc"|"konstantpegel"|"kratky_belueftet"|"kratky","bewertung": "gruen"|"knapp"|"ausserhalb","datenart": "echt"|"demo"|"test","ec_basis": "gesamt"|"zuwachs"|"unbekannt","ec_einheit": "mS/cm"|"µS/cm"|"ppm500"|"ppm700"|"cf","einstufung": "empfohlen"|"moeglich"|"nicht_empfohlen","ereignis_typ": "aussaat"|"deckel_geoeffnet"|"abdeckung_entfernt"|"keimung"|"phase_antwort"|"verschieben"|"umsetzdatum_geaendert"|"umsetzen"|"tausch"|"neu_beschriften"|"ernte"|"kultur_entscheid"|"schossen_handlung"|"abschluss"|"wiederherstellen"|"kurzpruefung"|"gefaess_erfasst"|"gefaesspruefung"|"box_deckel_tausch"|"ruhe"|"entfernt"|"geleert"|"gereinigt"|"bestaeubung"|"leitkultur_gewaehlt"|"sonde_gereinigt"|"als_unsicher_markiert"|"stromausfall"|"aufgabe_erledigt"|"messung_umgehaengt"|"sollwert_geaendert"|"beobachtung","ernteart": "einmalig"|"mehrfach","etikett_ergebnis": "gefunden"|"unbekannt"|"entfernt","etikett_format": "70x42_3"|"55x25","evidenzklasse": "A"|"B1"|"B2"|"C","fuellstand": "ueber_drittel"|"unter_drittel","gefaess_form": "rechteckig"|"oval","gefaess_status": "in_pruefung"|"in_betrieb_volumen_offen"|"in_betrieb"|"ruht"|"entfernt","groesse": "anwendbar"|"dauer"|"bbch"|"wechselmerkmal"|"ph"|"ec"|"licht_h"|"wassertemp"|"keimart"|"keimtemp","herkunft_duenger": "hersteller"|"abgeleitet","k_quelle": "startwert"|"becherversuch"|"vorschlag_uebernommen"|"zurueckgesetzt","ki_bewertung": "richtig"|"falsch"|"fehlend"|"erfunden","ki_feld": "name"|"art"|"keimart"|"keimtemperatur"|"keimdauer"|"kulturdauer"|"aussaatfenster"|"hersteller","ki_status": "uebernommen"|"geaendert"|"leer","klasse_saatmenge": "A"|"B"|"C"|"D","kulturform": "keimling"|"babyleaf"|"schnitt"|"kopf"|"dauerkultur_blatt"|"dauerkultur_frucht","kulturtyp": "blatt"|"knolle"|"frucht","liter_status": "belegt"|"testbetrieb_offen","luftpumpe": "P1"|"P2"|"P3"|"P4","messart": "rundgang"|"aufgabe"|"kontrolle_ansatz"|"end_ansatz"|"nachmessen"|"kontrolle_folgetag"|"w"|"frischwasser"|"ph_kontrolle","mischentscheid": "keiner"|"leitkultur"|"andere_phase"|"kompromiss","pflanzvorgang_einstieg": "heute"|"gefaess"|"scan"|"duplizieren"|"nacherfassung","phase": "keimung"|"anzucht"|"wachstum"|"bluete"|"fruchtbildung_reife","photoperiode": "langtag"|"kurztag"|"tagneutral","platz_rolle": "gefaess"|"anzuchtort"|"messstelle"|"lager","position_vh": "vorne"|"hinten","profil_ebene": "sorte"|"art"|"kulturgruppe"|"standard","push_art": "sammel"|"kurzpruefung_20"|"timer"|"test","push_kanal": "push"|"email","push_status": "geplant"|"gesendet"|"fehler"|"abgemeldet","pythium": "hoch"|"mittel"|"gering","quelle_klasse": "peer_review"|"universitaet_beratung"|"hersteller"|"praxis"|"katalog"|"tuete"|"app","schossen_handlung": "auskneifen"|"ernten_beenden"|"bluete_nutzen","stadium": "wurzeln_keimung"|"echte_blaetter"|"wachstum"|"vorbluete"|"bluete_frucht"|"reife","standort": "indoor"|"outdoor","storno_grund": "rueckgaengig"|"korrektur"|"fehleingabe","system": "dwc"|"kratky"|"nft"|"ebbe_flut"|"substrat_inert"|"keine","systemeignung": "dwc"|"kratky"|"beide","thema": "hell"|"dunkel"|"system","umgebung": "indoor_led"|"gewaechshaus"|"andere","vermerk": "keine"|"katalog"|"tuete"|"testbetrieb"|"leitkultur","wissen_ebene": "art"|"kulturgruppe"|"allgemein","wissenseintrag_typ": "naehrstoffe"|"duengerkomponenten"|"typischer_fehler"|"mangelbild"|"warnregel"|"ernte"|"sondenpflege"|"kratky_pegel"|"wurzelfarbe"|"topf_umsetzen"|"boxen_einzeln"|"stromausfall"|"schossen"|"entspitzen"|"bestaeubung"|"wochenfahrplan","wuchsform": "aufrecht"|"buschig"|"haengend"|"rosette"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "ansatz_schritt_typ": ["kalibrierung_pruefen", "absaugen", "frischwasser", "frischwasser_messen", "gerechnet_fuer", "micro", "spuelen", "grow", "bloom", "umruehren", "timer", "ph_einstellen", "kontrollmessung", "restdosis", "endmessung"],"ansatz_status": ["laufend", "abgeschlossen", "abgebrochen"],"ansatz_typ": ["neuansatz", "nachfuellen", "ph_korrektur", "teilwechsel"],"anzuchtort_typ": ["box_licht", "box_dunkel"],"aufschub_art": ["morgen", "ueberspringen", "pegel_ok"],"betriebsart": ["dwc", "konstantpegel", "kratky_belueftet", "kratky"],"bewertung": ["gruen", "knapp", "ausserhalb"],"datenart": ["echt", "demo", "test"],"ec_basis": ["gesamt", "zuwachs", "unbekannt"],"ec_einheit": ["mS/cm", "µS/cm", "ppm500", "ppm700", "cf"],"einstufung": ["empfohlen", "moeglich", "nicht_empfohlen"],"ereignis_typ": ["aussaat", "deckel_geoeffnet", "abdeckung_entfernt", "keimung", "phase_antwort", "verschieben", "umsetzdatum_geaendert", "umsetzen", "tausch", "neu_beschriften", "ernte", "kultur_entscheid", "schossen_handlung", "abschluss", "wiederherstellen", "kurzpruefung", "gefaess_erfasst", "gefaesspruefung", "box_deckel_tausch", "ruhe", "entfernt", "geleert", "gereinigt", "bestaeubung", "leitkultur_gewaehlt", "sonde_gereinigt", "als_unsicher_markiert", "stromausfall", "aufgabe_erledigt", "messung_umgehaengt", "sollwert_geaendert", "beobachtung"],"ernteart": ["einmalig", "mehrfach"],"etikett_ergebnis": ["gefunden", "unbekannt", "entfernt"],"etikett_format": ["70x42_3", "55x25"],"evidenzklasse": ["A", "B1", "B2", "C"],"fuellstand": ["ueber_drittel", "unter_drittel"],"gefaess_form": ["rechteckig", "oval"],"gefaess_status": ["in_pruefung", "in_betrieb_volumen_offen", "in_betrieb", "ruht", "entfernt"],"groesse": ["anwendbar", "dauer", "bbch", "wechselmerkmal", "ph", "ec", "licht_h", "wassertemp", "keimart", "keimtemp"],"herkunft_duenger": ["hersteller", "abgeleitet"],"k_quelle": ["startwert", "becherversuch", "vorschlag_uebernommen", "zurueckgesetzt"],"ki_bewertung": ["richtig", "falsch", "fehlend", "erfunden"],"ki_feld": ["name", "art", "keimart", "keimtemperatur", "keimdauer", "kulturdauer", "aussaatfenster", "hersteller"],"ki_status": ["uebernommen", "geaendert", "leer"],"klasse_saatmenge": ["A", "B", "C", "D"],"kulturform": ["keimling", "babyleaf", "schnitt", "kopf", "dauerkultur_blatt", "dauerkultur_frucht"],"kulturtyp": ["blatt", "knolle", "frucht"],"liter_status": ["belegt", "testbetrieb_offen"],"luftpumpe": ["P1", "P2", "P3", "P4"],"messart": ["rundgang", "aufgabe", "kontrolle_ansatz", "end_ansatz", "nachmessen", "kontrolle_folgetag", "w", "frischwasser", "ph_kontrolle"],"mischentscheid": ["keiner", "leitkultur", "andere_phase", "kompromiss"],"pflanzvorgang_einstieg": ["heute", "gefaess", "scan", "duplizieren", "nacherfassung"],"phase": ["keimung", "anzucht", "wachstum", "bluete", "fruchtbildung_reife"],"photoperiode": ["langtag", "kurztag", "tagneutral"],"platz_rolle": ["gefaess", "anzuchtort", "messstelle", "lager"],"position_vh": ["vorne", "hinten"],"profil_ebene": ["sorte", "art", "kulturgruppe", "standard"],"push_art": ["sammel", "kurzpruefung_20", "timer", "test"],"push_kanal": ["push", "email"],"push_status": ["geplant", "gesendet", "fehler", "abgemeldet"],"pythium": ["hoch", "mittel", "gering"],"quelle_klasse": ["peer_review", "universitaet_beratung", "hersteller", "praxis", "katalog", "tuete", "app"],"schossen_handlung": ["auskneifen", "ernten_beenden", "bluete_nutzen"],"stadium": ["wurzeln_keimung", "echte_blaetter", "wachstum", "vorbluete", "bluete_frucht", "reife"],"standort": ["indoor", "outdoor"],"storno_grund": ["rueckgaengig", "korrektur", "fehleingabe"],"system": ["dwc", "kratky", "nft", "ebbe_flut", "substrat_inert", "keine"],"systemeignung": ["dwc", "kratky", "beide"],"thema": ["hell", "dunkel", "system"],"umgebung": ["indoor_led", "gewaechshaus", "andere"],"vermerk": ["keine", "katalog", "tuete", "testbetrieb", "leitkultur"],"wissen_ebene": ["art", "kulturgruppe", "allgemein"],"wissenseintrag_typ": ["naehrstoffe", "duengerkomponenten", "typischer_fehler", "mangelbild", "warnregel", "ernte", "sondenpflege", "kratky_pegel", "wurzelfarbe", "topf_umsetzen", "boxen_einzeln", "stromausfall", "schossen", "entspitzen", "bestaeubung", "wochenfahrplan"],"wuchsform": ["aufrecht", "buschig", "haengend", "rosette"]
          }
        }
} as const
