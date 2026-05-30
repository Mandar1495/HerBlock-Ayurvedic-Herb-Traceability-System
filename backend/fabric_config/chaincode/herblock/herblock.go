/*
HerBlock Chaincode — Hyperledger Fabric
========================================
PATENT PENDING - Indian Patent Office
Innovation: GPS-Validated Ayurvedic Herb Traceability on Enterprise Blockchain

Copyright (c) 2026 HerBlock India

Chaincode functions:
  - recordCollection     Record herb collection with GPS geo-fence validation
  - recordQualityTest    Record immutable quality test result
  - recordProcessing     Record processing / aggregation event
  - recordProduct        Record final formulated product
  - getProductTrace      Get complete supply chain trace for a product
  - getCollection        Get single collection by ID
  - getHistory           Get change history for any key
  - getNetworkStatus     Get chaincode network status

Deploy:
  peer chaincode install -n herblock -v 1.0 -p chaincode/herblock
  peer chaincode instantiate -o orderer:7050 -C herblock -n herblock -v 1.0 -c '{"Args":["Init"]}'
*/

package main

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ─────────────────────────────────────────────
//  Data Models
// ─────────────────────────────────────────────

type CollectionEvent struct {
	DocType          string  `json:"docType"`
	CollectionID     string  `json:"collection_id"`
	ProductID        string  `json:"product_id"`
	CollectorID      string  `json:"collector_id"`
	CollectorName    string  `json:"collector_name"`
	SpeciesName      string  `json:"species_name"`
	Latitude         float64 `json:"latitude"`
	Longitude        float64 `json:"longitude"`
	LocationName     string  `json:"location_name"`
	State            string  `json:"state"`
	District         string  `json:"district"`
	QuantityKg       float64 `json:"quantity_kg"`
	QualityGrade     string  `json:"quality_grade"`
	WeatherConditions string `json:"weather_conditions"`
	OrganicCertified bool    `json:"organic_certified"`
	GeoValidated     bool    `json:"geo_validated"`
	GeoValidationMsg string  `json:"geo_validation_msg"`
	Timestamp        string  `json:"timestamp"`
}

type QualityTest struct {
	DocType             string `json:"docType"`
	TestID              string `json:"test_id"`
	ProductID           string `json:"product_id"`
	LabID               string `json:"lab_id"`
	LabName             string `json:"lab_name"`
	TestType            string `json:"test_type"`
	TestResult          string `json:"test_result"`
	PassFail            string `json:"pass_fail"`
	TestedBy            string `json:"tested_by"`
	CertificateNumber   string `json:"certificate_number"`
	AccreditationNumber string `json:"accreditation_number"`
	Timestamp           string `json:"timestamp"`
}

type ProcessingEvent struct {
	DocType            string  `json:"docType"`
	ProcessingID       string  `json:"processing_id"`
	ProductID          string  `json:"product_id"`
	SourceCollectionID string  `json:"source_collection_id"`
	ProcessorID        string  `json:"processor_id"`
	ProcessorName      string  `json:"processor_name"`
	FacilityName       string  `json:"facility_name"`
	FacilityLocation   string  `json:"facility_location"`
	ProcessingType     string  `json:"processing_type"`
	InputQuantityKg    float64 `json:"input_quantity_kg"`
	OutputQuantityKg   float64 `json:"output_quantity_kg"`
	BatchNumber        string  `json:"batch_number"`
	GMPCertified       bool    `json:"gmp_certified"`
	AYUSHLicense       string  `json:"ayush_license"`
	Timestamp          string  `json:"timestamp"`
}

type Product struct {
	DocType          string   `json:"docType"`
	ProductID        string   `json:"product_id"`
	ProductName      string   `json:"product_name"`
	ProductNameHindi string   `json:"product_name_hindi"`
	ManufacturerID   string   `json:"manufacturer_id"`
	ManufacturerName string   `json:"manufacturer_name"`
	AYUSHLicense     string   `json:"ayush_license"`
	FSSAILicense     string   `json:"fssai_license"`
	BatchNumber      string   `json:"batch_number"`
	ManufacturingDate string  `json:"manufacturing_date"`
	ExpiryDate       string   `json:"expiry_date"`
	MRP              float64  `json:"mrp"`
	SourceCollections []string `json:"source_collections"`
	ProcessingIDs    []string `json:"processing_ids"`
	QualityTestIDs   []string `json:"quality_test_ids"`
	Ingredients      []string `json:"ingredients"`
	Timestamp        string   `json:"timestamp"`
}

type ProductTrace struct {
	ProductID    string            `json:"product_id"`
	Product      *Product          `json:"product"`
	Collections  []CollectionEvent `json:"collections"`
	Processing   []ProcessingEvent `json:"processing"`
	QualityTests []QualityTest     `json:"quality_tests"`
	TotalEvents  int               `json:"total_events"`
	Verified     bool              `json:"blockchain_verified"`
}

// ─────────────────────────────────────────────
//  Geo-Fence Data (matches Python server.py)
// ─────────────────────────────────────────────

type GeoZone struct {
	CenterLat    float64
	CenterLon    float64
	MaxRadiusKm  float64
}

var HERB_ZONES = map[string]GeoZone{
	"Ashwagandha": {CenterLat: 26.0, CenterLon: 75.0, MaxRadiusKm: 1800},
	"Tulsi":       {CenterLat: 21.5, CenterLon: 82.5, MaxRadiusKm: 1500},
	"Brahmi":      {CenterLat: 18.0, CenterLon: 83.5, MaxRadiusKm: 700},
	"Giloy":       {CenterLat: 19.0, CenterLon: 81.0, MaxRadiusKm: 800},
	"Guduchi":     {CenterLat: 19.0, CenterLon: 81.0, MaxRadiusKm: 800},
	"Shatavari":   {CenterLat: 24.0, CenterLon: 77.5, MaxRadiusKm: 500},
}

// ─────────────────────────────────────────────
//  Patent Feature: Haversine Formula (Patent Claim 1)
// ─────────────────────────────────────────────

func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371.0 // Earth's mean radius in km
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	dPhi := (lat2 - lat1) * math.Pi / 180
	dLambda := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dPhi/2)*math.Sin(dPhi/2) +
		math.Cos(phi1)*math.Cos(phi2)*math.Sin(dLambda/2)*math.Sin(dLambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return math.Round(R*c*100) / 100
}

// Patent Claim 2: GPS Geo-Fence Validation
func validateGeoFence(lat, lon float64, species string) (bool, string) {
	zone, exists := HERB_ZONES[species]
	if !exists {
		return true, "no_zone_defined"
	}

	dist := haversineDistance(lat, lon, zone.CenterLat, zone.CenterLon)
	if dist > zone.MaxRadiusKm {
		return false, fmt.Sprintf("INVALID LOCATION: %.2f km from zone center (max %.0f km)", dist, zone.MaxRadiusKm)
	}
	return true, fmt.Sprintf("valid: %.2f km from zone center", dist)
}

// ─────────────────────────────────────────────
//  SmartContract
// ─────────────────────────────────────────────

type NetworkStatus struct {
	Status        string `json:"status"`
	Chaincode     string `json:"chaincode"`
	Version       string `json:"version"`
	PatentPending bool   `json:"patent_pending"`
	Timestamp     string `json:"timestamp"`
}

type HerBlockContract struct {
	contractapi.Contract
}

func (c *HerBlockContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("HerBlock Chaincode initialized — Patent Pending")
	return nil
}

func (c *HerBlockContract) GetNetworkStatus(ctx contractapi.TransactionContextInterface) (*NetworkStatus, error) {
	status := NetworkStatus{
		Status:        "active",
		Chaincode:     "herblock",
		Version:       "1.0.0",
		PatentPending: true,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
	}
	return &status, nil
}

// ─────────────────────────────────────────────
//  Collection Operations
// ─────────────────────────────────────────────

func (c *HerBlockContract) RecordCollection(
	ctx contractapi.TransactionContextInterface,
	collectionID string,
	dataJSON string,
) (*CollectionEvent, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(dataJSON), &data); err != nil {
		return nil, fmt.Errorf("invalid JSON: %v", err)
	}

	lat, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["latitude"]), 64)
	lon, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["longitude"]), 64)
	species := fmt.Sprintf("%v", data["species_name"])
	qtyKg, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["quantity_kg"]), 64)

	// Patent Claim 2: GPS Geo-Fence Validation
	geoValid, geoMsg := validateGeoFence(lat, lon, species)
	if !geoValid {
		return nil, fmt.Errorf(geoMsg)
	}

	event := CollectionEvent{
		DocType:          "collection",
		CollectionID:     collectionID,
		ProductID:        fmt.Sprintf("%v", data["product_id"]),
		CollectorID:      fmt.Sprintf("%v", data["collector_id"]),
		CollectorName:    fmt.Sprintf("%v", data["collector_name"]),
		SpeciesName:      species,
		Latitude:         lat,
		Longitude:        lon,
		LocationName:     fmt.Sprintf("%v", data["location_name"]),
		State:            fmt.Sprintf("%v", data["state"]),
		District:         fmt.Sprintf("%v", data["district"]),
		QuantityKg:       qtyKg,
		QualityGrade:     fmt.Sprintf("%v", data["quality_grade"]),
		WeatherConditions: fmt.Sprintf("%v", data["weather_conditions"]),
		GeoValidated:     true,
		GeoValidationMsg: geoMsg,
		Timestamp:        time.Now().UTC().Format(time.RFC3339),
	}

	if org, ok := data["organic_certified"].(bool); ok {
		event.OrganicCertified = org
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return nil, err
	}

	if err := ctx.GetStub().PutState("COLL_"+collectionID, eventJSON); err != nil {
		return nil, fmt.Errorf("failed to store collection: %v", err)
	}

	// Emit event for listeners
	ctx.GetStub().SetEvent("CollectionRecorded", eventJSON)
	return &event, nil
}

func (c *HerBlockContract) GetCollection(
	ctx contractapi.TransactionContextInterface,
	collectionID string,
) (*CollectionEvent, error) {
	data, err := ctx.GetStub().GetState("COLL_" + collectionID)
	if err != nil || data == nil {
		return nil, fmt.Errorf("collection %s not found", collectionID)
	}
	var event CollectionEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return nil, err
	}
	return &event, nil
}

// ─────────────────────────────────────────────
//  Quality Test Operations
// ─────────────────────────────────────────────

func (c *HerBlockContract) RecordQualityTest(
	ctx contractapi.TransactionContextInterface,
	testID string,
	dataJSON string,
) (*QualityTest, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(dataJSON), &data); err != nil {
		return nil, fmt.Errorf("invalid JSON: %v", err)
	}

	test := QualityTest{
		DocType:             "quality_test",
		TestID:              testID,
		ProductID:           fmt.Sprintf("%v", data["product_id"]),
		LabID:               fmt.Sprintf("%v", data["lab_id"]),
		LabName:             fmt.Sprintf("%v", data["lab_name"]),
		TestType:            fmt.Sprintf("%v", data["test_type"]),
		TestResult:          fmt.Sprintf("%v", data["test_result"]),
		PassFail:            strings.ToUpper(fmt.Sprintf("%v", data["pass_fail"])),
		TestedBy:            fmt.Sprintf("%v", data["tested_by"]),
		CertificateNumber:   fmt.Sprintf("%v", data["certificate_number"]),
		AccreditationNumber: fmt.Sprintf("%v", data["accreditation_number"]),
		Timestamp:           time.Now().UTC().Format(time.RFC3339),
	}

	testJSON, err := json.Marshal(test)
	if err != nil {
		return nil, err
	}

	if err := ctx.GetStub().PutState("QT_"+testID, testJSON); err != nil {
		return nil, fmt.Errorf("failed to store quality test: %v", err)
	}

	ctx.GetStub().SetEvent("QualityTestRecorded", testJSON)
	return &test, nil
}

// ─────────────────────────────────────────────
//  Processing Operations
// ─────────────────────────────────────────────

func (c *HerBlockContract) RecordProcessing(
	ctx contractapi.TransactionContextInterface,
	processingID string,
	dataJSON string,
) (*ProcessingEvent, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(dataJSON), &data); err != nil {
		return nil, fmt.Errorf("invalid JSON: %v", err)
	}

	inputQty, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["input_quantity_kg"]), 64)
	outputQty, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["output_quantity_kg"]), 64)
	gmpCert := false
	if g, ok := data["gmp_certified"].(bool); ok {
		gmpCert = g
	}

	event := ProcessingEvent{
		DocType:            "processing",
		ProcessingID:       processingID,
		ProductID:          fmt.Sprintf("%v", data["product_id"]),
		SourceCollectionID: fmt.Sprintf("%v", data["source_collection_id"]),
		ProcessorID:        fmt.Sprintf("%v", data["processor_id"]),
		ProcessorName:      fmt.Sprintf("%v", data["processor_name"]),
		FacilityName:       fmt.Sprintf("%v", data["facility_name"]),
		FacilityLocation:   fmt.Sprintf("%v", data["facility_location"]),
		ProcessingType:     fmt.Sprintf("%v", data["processing_type"]),
		InputQuantityKg:    inputQty,
		OutputQuantityKg:   outputQty,
		BatchNumber:        fmt.Sprintf("%v", data["batch_number"]),
		GMPCertified:       gmpCert,
		AYUSHLicense:       fmt.Sprintf("%v", data["ayush_license"]),
		Timestamp:          time.Now().UTC().Format(time.RFC3339),
	}

	eventJSON, err := json.Marshal(event)
	if err != nil {
		return nil, err
	}

	if err := ctx.GetStub().PutState("PROC_"+processingID, eventJSON); err != nil {
		return nil, fmt.Errorf("failed to store processing event: %v", err)
	}

	ctx.GetStub().SetEvent("ProcessingRecorded", eventJSON)
	return &event, nil
}

// ─────────────────────────────────────────────
//  Product Operations
// ─────────────────────────────────────────────

func (c *HerBlockContract) RecordProduct(
	ctx contractapi.TransactionContextInterface,
	productID string,
	dataJSON string,
) (*Product, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(dataJSON), &data); err != nil {
		return nil, fmt.Errorf("invalid JSON: %v", err)
	}

	mrp := 0.0
	if m, ok := data["mrp"]; ok {
		mrp, _ = strconv.ParseFloat(fmt.Sprintf("%v", m), 64)
	}

	// Parse slice fields
	parseStringSlice := func(key string) []string {
		if v, ok := data[key]; ok {
			if raw, err := json.Marshal(v); err == nil {
				var s []string
				if json.Unmarshal(raw, &s) == nil {
					return s
				}
			}
		}
		return []string{}
	}

	product := Product{
		DocType:           "product",
		ProductID:         productID,
		ProductName:       fmt.Sprintf("%v", data["product_name"]),
		ProductNameHindi:  fmt.Sprintf("%v", data["product_name_hindi"]),
		ManufacturerID:    fmt.Sprintf("%v", data["manufacturer_id"]),
		ManufacturerName:  fmt.Sprintf("%v", data["manufacturer_name"]),
		AYUSHLicense:      fmt.Sprintf("%v", data["ayush_license"]),
		FSSAILicense:      fmt.Sprintf("%v", data["fssai_license"]),
		BatchNumber:       fmt.Sprintf("%v", data["batch_number"]),
		ManufacturingDate: fmt.Sprintf("%v", data["manufacturing_date"]),
		ExpiryDate:        fmt.Sprintf("%v", data["expiry_date"]),
		MRP:               mrp,
		SourceCollections: parseStringSlice("source_collections"),
		ProcessingIDs:     parseStringSlice("processing_ids"),
		QualityTestIDs:    parseStringSlice("quality_test_ids"),
		Ingredients:       parseStringSlice("ingredients"),
		Timestamp:         time.Now().UTC().Format(time.RFC3339),
	}

	productJSON, err := json.Marshal(product)
	if err != nil {
		return nil, err
	}

	if err := ctx.GetStub().PutState("PROD_"+productID, productJSON); err != nil {
		return nil, fmt.Errorf("failed to store product: %v", err)
	}

	ctx.GetStub().SetEvent("ProductRecorded", productJSON)
	return &product, nil
}

// ─────────────────────────────────────────────
//  Traceability
// ─────────────────────────────────────────────

func (c *HerBlockContract) GetProductTrace(
	ctx contractapi.TransactionContextInterface,
	productID string,
) (*ProductTrace, error) {
	trace := &ProductTrace{
		ProductID:    productID,
		Collections:  []CollectionEvent{},
		Processing:   []ProcessingEvent{},
		QualityTests: []QualityTest{},
		Verified:     true,
	}

	// Try to get the product
	productData, err := ctx.GetStub().GetState("PROD_" + productID)
	if err == nil && productData != nil {
		var product Product
		if json.Unmarshal(productData, &product) == nil {
			trace.Product = &product
		}
	}

	// Use rich query if CouchDB is available, else iterate common key prefixes
	// Here we do a range query over known key patterns for the product
	// Collections linked to productID
	collectionIterator, err := ctx.GetStub().GetStateByRange("COLL_", "COLL_~")
	if err == nil {
		defer collectionIterator.Close()
		for collectionIterator.HasNext() {
			result, err := collectionIterator.Next()
			if err != nil {
				continue
			}
			var event CollectionEvent
			if json.Unmarshal(result.Value, &event) == nil {
				if event.ProductID == productID || event.CollectionID == productID {
					trace.Collections = append(trace.Collections, event)
				}
			}
		}
	}

	// Processing events
	procIterator, err := ctx.GetStub().GetStateByRange("PROC_", "PROC_~")
	if err == nil {
		defer procIterator.Close()
		for procIterator.HasNext() {
			result, err := procIterator.Next()
			if err != nil {
				continue
			}
			var event ProcessingEvent
			if json.Unmarshal(result.Value, &event) == nil {
				if event.ProductID == productID {
					trace.Processing = append(trace.Processing, event)
				}
			}
		}
	}

	// Quality tests
	qtIterator, err := ctx.GetStub().GetStateByRange("QT_", "QT_~")
	if err == nil {
		defer qtIterator.Close()
		for qtIterator.HasNext() {
			result, err := qtIterator.Next()
			if err != nil {
				continue
			}
			var test QualityTest
			if json.Unmarshal(result.Value, &test) == nil {
				if test.ProductID == productID {
					trace.QualityTests = append(trace.QualityTests, test)
				}
			}
		}
	}

	trace.TotalEvents = len(trace.Collections) + len(trace.Processing) + len(trace.QualityTests)
	return trace, nil
}

// GetHistory returns all historical values for a key (Patent Claim 3 — immutability proof)
func (c *HerBlockContract) GetHistory(
	ctx contractapi.TransactionContextInterface,
	key string,
) ([]map[string]interface{}, error) {
	historyIterator, err := ctx.GetStub().GetHistoryForKey(key)
	if err != nil {
		return nil, fmt.Errorf("failed to get history for key %s: %v", key, err)
	}
	defer historyIterator.Close()

	var history []map[string]interface{}
	for historyIterator.HasNext() {
		modification, err := historyIterator.Next()
		if err != nil {
			continue
		}
		entry := map[string]interface{}{
			"tx_id":     modification.TxId,
			"timestamp": modification.Timestamp,
			"is_delete": modification.IsDelete,
		}
		if !modification.IsDelete && modification.Value != nil {
			var value interface{}
			if json.Unmarshal(modification.Value, &value) == nil {
				entry["value"] = value
			}
		}
		history = append(history, entry)
	}
	return history, nil
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────

func main() {
	chaincode, err := contractapi.NewChaincode(&HerBlockContract{})
	if err != nil {
		fmt.Printf("Error creating HerBlock chaincode: %v\n", err)
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting HerBlock chaincode: %v\n", err)
	}
}
