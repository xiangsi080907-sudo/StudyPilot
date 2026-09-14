-- Course.currentGrade and Course.targetGrade previously stored percentages.
-- Convert only values above 4.0; values in the GPA range are already valid and remain unchanged.
-- The conversion uses the documented common U.S. plus/minus scale:
-- 93–100=4.0, 90–92=3.7, 87–89=3.3, 83–86=3.0, 80–82=2.7,
-- 77–79=2.3, 73–76=2.0, 70–72=1.7, 67–69=1.3, 63–66=1.0,
-- 60–62=0.7, below 60=0.0.

UPDATE "Course"
SET "currentGrade" = CASE
  WHEN "currentGrade" >= 93 THEN 4.0
  WHEN "currentGrade" >= 90 THEN 3.7
  WHEN "currentGrade" >= 87 THEN 3.3
  WHEN "currentGrade" >= 83 THEN 3.0
  WHEN "currentGrade" >= 80 THEN 2.7
  WHEN "currentGrade" >= 77 THEN 2.3
  WHEN "currentGrade" >= 73 THEN 2.0
  WHEN "currentGrade" >= 70 THEN 1.7
  WHEN "currentGrade" >= 67 THEN 1.3
  WHEN "currentGrade" >= 63 THEN 1.0
  WHEN "currentGrade" >= 60 THEN 0.7
  ELSE 0.0
END
WHERE "currentGrade" > 4.0;

UPDATE "Course"
SET "targetGrade" = CASE
  WHEN "targetGrade" >= 93 THEN 4.0
  WHEN "targetGrade" >= 90 THEN 3.7
  WHEN "targetGrade" >= 87 THEN 3.3
  WHEN "targetGrade" >= 83 THEN 3.0
  WHEN "targetGrade" >= 80 THEN 2.7
  WHEN "targetGrade" >= 77 THEN 2.3
  WHEN "targetGrade" >= 73 THEN 2.0
  WHEN "targetGrade" >= 70 THEN 1.7
  WHEN "targetGrade" >= 67 THEN 1.3
  WHEN "targetGrade" >= 63 THEN 1.0
  WHEN "targetGrade" >= 60 THEN 0.7
  ELSE 0.0
END
WHERE "targetGrade" > 4.0;
