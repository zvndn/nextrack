//! Rust counterpart to the web smart-queue scorer.
//!
//! It deliberately has no dependencies so it can be embedded in a future import
//! worker or compiled to WASM without bringing a JavaScript runtime into a
//! high-volume ranking job.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Status { Watching, PlanToWatch, Paused, Dropped, Completed }

#[derive(Debug, Clone, Copy)]
pub struct Candidate { pub status: Status, pub progress: f32, pub watched: u32, pub total: u32, pub rating: Option<f32>, pub days_since_update: u32 }

pub fn score(item: Candidate) -> Option<f32> {
    if matches!(item.status, Status::Completed | Status::Dropped) { return None; }
    let progress = item.progress.clamp(0.0, 100.0);
    let stale = item.days_since_update.min(if matches!(item.status, Status::Paused | Status::PlanToWatch) { 30 } else { 21 }) as f32;
    Some(match item.status {
        Status::Watching => {
            let remaining = item.total.saturating_sub(item.watched).min(24);
            300.0 + progress * 1.5 + stale + (24 - remaining) as f32 * 3.0
        }
        Status::Paused => 120.0 + progress + stale,
        Status::PlanToWatch => 80.0 + item.rating.unwrap_or(0.0).clamp(0.0, 10.0) * 4.0 + stale,
        Status::Dropped | Status::Completed => unreachable!(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn active_titles_outrank_plans() {
        let active = Candidate { status: Status::Watching, progress: 40.0, watched: 4, total: 12, rating: None, days_since_update: 2 };
        let planned = Candidate { status: Status::PlanToWatch, progress: 0.0, watched: 0, total: 0, rating: Some(10.0), days_since_update: 30 };
        assert!(score(active) > score(planned));
    }
    #[test]
    fn completed_titles_are_excluded() {
        assert_eq!(score(Candidate { status: Status::Completed, progress: 100.0, watched: 1, total: 1, rating: None, days_since_update: 0 }), None);
    }
}
