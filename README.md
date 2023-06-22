# Visualize COVID-19 vaccination stance in relation with (de)motivating topics

Vaccine hesitancy is one of the significant obstacles to eradicating COVID-19 and putting humanity back on track. In my thesis, I analyzed the (de)motivating topics and their relation to the public stance toward the COVID-19 vaccine. This visualization approach may help us understand the relation between resonating topics on social media that are (de)motivating the public and help the healthcare workers to address them accordingly.

## Data
The data contains CSV files with anonymized user names, tweet texts, vaccine stance, cumulative score for the vaccine stance, location, and topic information. The file named `all_predicted_cumulative_stance.csv` contains all the tweets, scores, and classifications. We have broken this file into two separate files named `demotivate_cumulative_stance.csv` and `motivate_cumulative_stance.csv`, containing the `demotivating` and `motivating` tweets, respectively. These two files are used for the visualization.

## Paper
The related paper for this work is available [here](https://arxiv.org/abs/2306.12118).

## Citation
If you use this work, please cite the following paper:
```
Ashiqur Rahman and Hamed Alhoori. 2023. 
Visualizing Relation Between (De)Motivating Topics and Public Stance toward COVID-19 Vaccine. 
In Proceedings of 2023 ACM/IEEE Joint Conference on Digital Libraries (JCDL). 
DOI:https://doi.org/10.1109/JCDL57899.2023.00067
```