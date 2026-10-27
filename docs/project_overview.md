# Project Overview

## Project Title
**Big Data Analytics for Crime Pattern Analysis and Crime Risk Prediction using Hadoop and Machine Learning**

**Academic Context:** B.Tech Computer Engineering — Big Data Analytics Mini-Project

---

## 1. Problem Statement
Urban public safety agencies record millions of crime incident logs detailing offense categories, timestamps, locations, and premise classifications. However, traditional database management systems (RDBMS) struggle with the volume, velocity, and semi-structured nature of such spatial-temporal datasets. 

Law enforcement analysts face two critical bottlenecks:
1. **Inefficient Scalability:** Processing gigabytes of crime logs using single-node relational queries leads to high latency and failure to detect multi-dimensional trends.
2. **Descriptive Rather Than Analytical Decision Making:** Raw logs record historical events without identifying geographic spatial clusters (hotspots) or evaluating aggregate risk density across seasonal and diurnal cycles.

## 2. Project Objectives
This project develops an end-to-end Big Data Analytics and Machine Learning system that:
- **Demonstrates Distributed Storage & Computing:** Ingests large-scale crime records into Hadoop HDFS and processes them using Apache Spark (PySpark) DataFrames.
- **Performs Exploratory Pattern Discovery:** Extracts 12 comprehensive analytical indicators, including monthly trends, peak diurnal hours, weekday-vs-weekend dynamics, and high-density police divisions.
- **Identifies Spatial Hotspots with Unsupervised ML:** Fits a K-Means clustering algorithm on valid latitude and longitude coordinates to identify and rank incident concentration centroids.
- **Classifies Aggregate Crime Risk with Supervised ML:** Formulates historical incident frequency tertiles ($Q_{33}$ and $Q_{66}$) on aggregate spatio-temporal units (Area, Month, Day of Week, Time Period) and trains an ensemble Random Forest Classifier to categorize them into **Low Risk**, **Medium Risk**, and **High Risk**.
- **Provides an Interactive Visual Analytics Dashboard:** Connects a modern React + Vite interface with Leaflet OpenStreetMap tiles, Recharts visualizations, and a FastAPI backend.

---

## 3. Scope of the System
- **In-Scope:**
  - Automated schema inference and canonical attribute mapping for the Kaggle *“Crime Data from 2020 to Present”* dataset (LAPD).
  - Cleaning pipelines: coordinate bounds verification, duplicate elimination, military time parsing, and domain categorization.
  - Dual Execution Paradigm: **Mode A (Local Development)** and **Mode B (Hadoop HDFS Integration)** with transparent status reporting.
  - Interactive prediction of historical risk category given a target division, month, day, and operational period.
  - Pipeline management interface with real-time log monitoring.

- **Out-of-Scope / Non-Goals:**
  - **No Individual Profiling:** This system does not evaluate or predict whether a specific individual will commit a crime, nor does it track individual suspect identities.
  - **Not a Live Tactical Dispatcher:** The application is an analytical planning tool based on historical patterns, not a real-time 911 dispatch terminal.

---

## 4. Expected Educational Outcomes
Upon review and viva demonstration, this project validates competence in:
1. Configuring distributed storage directories on HDFS (`/crime-analysis/raw/`, `/processed/`, `/analytics/`, `/models/`).
2. Designing Catalyst-optimized PySpark DataFrame transformations and vectorised fallback operations.
3. Preventing data leakage in machine learning workflows by deriving target thresholds strictly on the training partition.
4. Evaluating multiclass classification using Accuracy, Macro F1, Precision, Recall, and Confusion Matrices.
5. Deploying asynchronous background tasks in Python (FastAPI) and building modern interactive frontend dashboards (React + Leaflet).
