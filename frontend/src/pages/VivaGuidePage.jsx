import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
  Layers,
  Server,
  Database,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const VIVA_QUESTIONS = [
  {
    q: "1. What is the core objective of this Big Data Analytics project?",
    category: "Project Scope",
    a: "The project ingests large-scale historical crime records (Kaggle LAPD Crime Data from 2020 to Present), processes and cleans them using Apache Spark and distributed HDFS paradigms, discovers geographical crime hotspots using K-Means clustering, and classifies aggregate area/time periods into Low, Medium, and High historical crime-risk categories using a Random Forest Classifier."
  },
  {
    q: "2. Why is Apache Hadoop and HDFS included in this project architecture?",
    category: "Hadoop & HDFS",
    a: "Hadoop provides distributed, fault-tolerant block-based storage (HDFS) designed to store massive datasets across commodity hardware without single-point failures. In this architecture, HDFS organizes datasets into structured directories (/crime-analysis/raw, /crime-analysis/processed, /crime-analysis/analytics, /crime-analysis/models), decoupling scalable storage from computation."
  },
  {
    q: "3. What is the difference between Mode A (Local Development) and Mode B (Hadoop Integration)?",
    category: "Architecture",
    a: "Mode A runs seamlessly on local developer workstations using local filesystem paths and PySpark's local[*] engine or vectorised Python operations. Mode B integrates with an active Hadoop NameNode/DataNode (via WebHDFS REST API or HDFS RPC), verifying distributed read/write operations. The system transparently reports which mode is active to maintain academic integrity."
  },
  {
    q: "4. Why is Apache Spark preferred over traditional MapReduce for crime data processing?",
    category: "Apache Spark",
    a: "Traditional Hadoop MapReduce writes intermediate results to disk after every map and reduce phase, causing heavy I/O overhead. Apache Spark performs in-memory computations using Resilient Distributed Datasets (RDDs) and Catalyst-optimized DataFrames, resulting in up to 100x faster execution for multi-pass aggregations, filtering, and machine learning pipelines."
  },
  {
    q: "5. What data cleaning operations are executed in the PySpark pipeline?",
    category: "Data Engineering",
    a: "1. Deduplication using division record numbers (DR_NO).\n2. Coordinate filtering: removing placeholder coordinates (0.0, 0.0) and points outside Los Angeles County bounds (Lat: 33.65 - 34.40, Lon: -118.75 - -118.10).\n3. Temporal parsing: converting military time (TIME OCC) into 24-hr hours and 4 standardized periods (Night, Morning, Afternoon, Evening).\n4. Normalized crime categorization into standardized legal categories."
  },
  {
    q: "6. How does K-Means identify geographical crime hotspots?",
    category: "Machine Learning",
    a: "K-Means is an unsupervised clustering algorithm that partitions n spatial coordinate points (Latitude, Longitude) into K distinct clusters. It iteratively minimizes the within-cluster sum of squares (inertia): J = sum(||x_i - mu_k||^2). The resulting cluster centroids represent geographic centers of crime incident concentration."
  },
  {
    q: "7. Are K-Means cluster numbers equivalent to risk scores?",
    category: "Machine Learning",
    a: "No. Cluster indices (e.g., Cluster 0, 1, 2) in K-Means are arbitrary numerical labels assigned during initialization. In this system, hotspots are explicitly ranked #1 to #K based on observed incident volume (frequency count of incidents assigned to that centroid), not the raw cluster index."
  },
  {
    q: "8. How are the Low, Medium, and High crime risk labels formulated?",
    category: "Feature Engineering",
    a: "Cleaned crime records are aggregated into spatio-temporal cells: (Area Name, Month, Day of Week, Time Period) -> Incident Count N. Tertile quantiles (Q33 and Q66) are computed strictly on the training partition: N <= Q33 is Low Risk, Q33 < N <= Q66 is Medium Risk, and N > Q66 is High Risk. Thresholds are locked and reused on the test set to avoid data leakage."
  },
  {
    q: "9. Why were personal victim characteristics excluded from the risk classification features?",
    category: "Ethics & Integrity",
    a: "In accordance with ethical AI guidelines, individual traits such as victim age, sex, and ethnicity must not be used to predict crime risk. The system focuses solely on aggregate spatio-temporal attributes (geographic division, seasonal month, day of week, time period, weekend flag) to evaluate historical environmental activity."
  },
  {
    q: "10. What machine learning algorithm was chosen for risk classification and why?",
    category: "Machine Learning",
    a: "A Random Forest Classifier with 100 estimators was selected. Random Forest is an ensemble of decision trees using bagging (bootstrap aggregation) and random feature subspace selection. It excels at capturing non-linear interactions between temporal features and geographic divisions, resisting overfitting and handling class balance via class weights."
  },
  {
    q: "11. What baseline model was used to validate the Random Forest Classifier?",
    category: "Model Evaluation",
    a: "Multinomial Logistic Regression was implemented as the linear baseline. In our benchmarks, Logistic Regression achieved ~52.0% accuracy, whereas Random Forest achieved ~54.7% accuracy with superior F1 scores, proving that non-linear ensemble boundaries better capture crime pattern interactions."
  },
  {
    q: "12. What evaluation metrics are reported for the classifier?",
    category: "Model Evaluation",
    a: "1. Multiclass Accuracy.\n2. Macro-averaged Precision, Recall, and F1-score (giving equal weight to each risk category regardless of size).\n3. Weighted F1-score.\n4. Full 3x3 Confusion Matrix detailing true positives, false positives, and false negatives across Low, Medium, and High Risk."
  },
  {
    q: "13. What is data leakage and how was it prevented in this project?",
    category: "Machine Learning",
    a: "Data leakage occurs when information from outside the training dataset (such as the test split or future events) is inadvertently used to create features or labels. In this project: 1) Train/test splitting was performed BEFORE calculating quantile thresholds; 2) The test set was evaluated strictly with thresholds learned from the train set; 3) No future incident counts were used as features."
  },
  {
    q: "14. How does the backend execute long-running Spark jobs without blocking web requests?",
    category: "Backend Architecture",
    a: "FastAPI utilizes asynchronous background workers (BackgroundTasks) and thread locks (threading.Lock). When a pipeline execution is triggered via POST /api/pipeline/run, a background worker is dispatched, immediately returning an HTTP 200 response while the job runs asynchronously and streams live logs to the status endpoint."
  },
  {
    q: "15. What role does Parquet file format play in this pipeline?",
    category: "Big Data Storage",
    a: "Apache Parquet is an open-source, column-oriented data storage format. Unlike row-based CSV files, Parquet provides snappy compression, efficient dictionary encoding, and column projection (reading only the required fields during analytical queries), reducing disk I/O and query latency by up to 80%."
  },
  {
    q: "16. How does the interactive geographical map render crime hotspots in the frontend?",
    category: "Frontend & UI",
    a: "The dashboard uses Leaflet.js with OpenStreetMap raster tiles. Backend /api/hotspots provides cluster centroid coordinates (latitude, longitude), incident count, and approximate radius. The frontend renders vector circle overlays with colors scaled to hotspot rank (Red = Top 3, Amber = 4-7, Sky Blue = others) and interactive popups."
  },
  {
    q: "17. What are the key exploratory crime pattern insights discovered in the data?",
    category: "Exploratory Analytics",
    a: "1. Assault & Battery and Vehicle Thefts constitute over 35% of all reported crimes.\n2. Crime volume peaks significantly between 18:00 and 23:00 (Evening).\n3. Weekend incidents exhibit higher assault and vehicle theft density, whereas weekday crimes feature higher burglary and identity theft.\n4. Central, Rampart, and 77th Street divisions exhibit the highest aggregate crime density."
  },
  {
    q: "18. What are the known limitations of this analytical system?",
    category: "Limitations",
    a: "1. Historical Reporting Bias: The dataset reflects reported crimes, which can be influenced by varying community reporting behaviors or police patrolling priorities.\n2. Not an Individual Predictor: The tool models aggregate historical frequencies, not individual behavioral probabilities.\n3. Weather / Socio-economic Factors: Features are limited to spatio-temporal variables without external weather or economic covariate feeds."
  },
  {
    q: "19. How does the system handle missing or corrupt data records?",
    category: "Data Quality",
    a: "The DataLoader and PySpark services perform explicit validation: records with missing dates or corrupt timestamps fall back to safe parsing with dateutil; records with placeholder coordinates (0, 0) or coordinates outside Los Angeles bounds are safely isolated and logged in the data quality audit table."
  },
  {
    q: "20. How is CORS configured between the React Vite frontend and FastAPI backend?",
    category: "Full Stack Integration",
    a: "FastAPI uses Starlette's CORSMiddleware configured in app/main.py. It allows requests from http://localhost:5173 (Vite's default port) with authorized GET, POST, and OPTIONS headers, preventing Cross-Origin Resource Sharing security rejections in the browser."
  }
];

export default function VivaGuidePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Project Scope', 'Hadoop & HDFS', 'Apache Spark', 'Machine Learning', 'Data Engineering', 'Model Evaluation', 'Architecture', 'Ethics & Integrity'];

  const filteredQuestions = VIVA_QUESTIONS.filter(item => {
    const matchesSearch = item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.a.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            Academic Viva Voce & System Architecture Guide
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive reference covering Hadoop HDFS, PySpark DataFrames, K-Means Hotspot Detection, Random Forest Risk Classification, and API Design.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-sky-950 border border-sky-800 text-xs text-sky-300 font-semibold">
          20 Curated Viva Questions
        </div>
      </div>

      {/* Architecture & Data Flow Diagram Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          End-to-End System Architecture & Data Flow
        </h3>

        {/* Visual Pipeline Flow Chart */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <div className="text-[10px] uppercase font-mono text-slate-400 font-bold">Phase 1</div>
            <div className="text-xs font-bold text-white">Raw Kaggle CSV</div>
            <div className="text-[10px] text-slate-400">LAPD Crime Data 2020-Present</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 text-center space-y-1">
            <div className="text-[10px] uppercase font-mono text-sky-400 font-bold">Phase 2</div>
            <div className="text-xs font-bold text-white">HDFS Storage</div>
            <div className="text-[10px] text-slate-400">/crime-analysis/raw/</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 text-center space-y-1">
            <div className="text-[10px] uppercase font-mono text-purple-400 font-bold">Phase 3</div>
            <div className="text-xs font-bold text-white">Apache PySpark</div>
            <div className="text-[10px] text-slate-400">Cleaning, Bounds & Dedup</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 text-center space-y-1">
            <div className="text-[10px] uppercase font-mono text-amber-400 font-bold">Phase 4</div>
            <div className="text-xs font-bold text-white">K-Means & RF</div>
            <div className="text-[10px] text-slate-400">Spatial Hotspots & Risk ML</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-center space-y-1">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Phase 5</div>
            <div className="text-xs font-bold text-white">FastAPI REST</div>
            <div className="text-[10px] text-slate-400">Pydantic & Async Workers</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-sky-500/40 text-center space-y-1">
            <div className="text-[10px] uppercase font-mono text-sky-400 font-bold">Phase 6</div>
            <div className="text-xs font-bold text-white">React + Leaflet</div>
            <div className="text-[10px] text-slate-400">Interactive Visual Analytics</div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search viva questions or keywords (e.g., HDFS, K-Means, Spark, leakage)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
            No viva questions matched your search query.
          </div>
        ) : (
          filteredQuestions.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg transition-colors"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? -1 : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800 shrink-0">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-white">{item.q}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 text-xs text-slate-300 border-t border-slate-800/60 bg-slate-950/40 leading-relaxed whitespace-pre-line">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
