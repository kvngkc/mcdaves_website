// src/vto-pipeline/validator/AssetValidator.ts
/**
 * Strict Eyewear Asset Validation Engine.
 * Verifies geometry integrity, non-zero bounding bounds, valid transforms,
 * material resolutions, and generates actionable validation reports.
 */

import {
  AssetInspectionReport,
  AssetValidationReport,
  ValidationCheckResult,
} from '../types/AssetTypes';

export class AssetValidator {
  /**
   * Validates an inspected asset report against strict VTO production criteria.
   */
  public validate(report: AssetInspectionReport): AssetValidationReport {
    const checks: ValidationCheckResult[] = [];

    // 1. Geometry Checks
    if (report.meshCount === 0 || report.totalVertices === 0) {
      checks.push({
        category: 'Geometry',
        name: 'Mesh Existence',
        status: 'FAIL',
        message: 'No 3D meshes or vertices found in asset hierarchy.',
      });
    } else {
      checks.push({
        category: 'Geometry',
        name: 'Mesh Existence',
        status: 'PASS',
        message: `Asset contains ${report.meshCount} mesh(es) with ${report.totalVertices.toLocaleString()} vertices and ${report.totalFaces.toLocaleString()} faces.`,
      });
    }

    if (report.totalVertices > 350000) {
      checks.push({
        category: 'Geometry',
        name: 'Vertex Budget',
        status: 'WARNING',
        message: `High vertex count (${report.totalVertices.toLocaleString()}). May impact performance on low-end mobile devices. Recommend decimation.`,
      });
    } else {
      checks.push({
        category: 'Geometry',
        name: 'Vertex Budget',
        status: 'PASS',
        message: `Vertex count (${report.totalVertices.toLocaleString()}) is within recommended mobile AR limits.`,
      });
    }

    // 2. Dimension Checks
    const { size, center } = report.nativeBounds;
    const isFiniteBox =
      Number.isFinite(size.x) &&
      Number.isFinite(size.y) &&
      Number.isFinite(size.z) &&
      Number.isFinite(center.x) &&
      Number.isFinite(center.y) &&
      Number.isFinite(center.z);

    if (!isFiniteBox) {
      checks.push({
        category: 'Dimensions',
        name: 'Finite Coordinates',
        status: 'FAIL',
        message: 'Bounding box contains NaN or Infinite coordinates.',
      });
    } else if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
      checks.push({
        category: 'Dimensions',
        name: 'Non-Zero Bounds',
        status: 'FAIL',
        message: `Degenerate 3D bounds: Width=${size.x}, Height=${size.y}, Depth=${size.z}`,
      });
    } else {
      checks.push({
        category: 'Dimensions',
        name: 'Bounding Box',
        status: 'PASS',
        message: `Non-zero bounding box: ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} (GLB units).`,
      });
    }

    // Aspect Ratio Sanity Check: Glasses are wider than they are tall (typically Width > 1.5x Height)
    if (size.x > 0 && size.y > 0) {
      const widthToHeight = size.x / size.y;
      if (widthToHeight < 1.1) {
        checks.push({
          category: 'Dimensions',
          name: 'Eyewear Aspect Ratio',
          status: 'WARNING',
          message: `Unusual aspect ratio: Width/Height is ${widthToHeight.toFixed(2)} (typically > 1.5 for eyewear). Verify model orientation.`,
        });
      } else {
        checks.push({
          category: 'Dimensions',
          name: 'Eyewear Aspect Ratio',
          status: 'PASS',
          message: `Aspect ratio Width/Height is ${widthToHeight.toFixed(2)} (standard eyewear geometry).`,
        });
      }
    }

    // 3. Materials Checks
    if (report.materialNames.length === 0) {
      checks.push({
        category: 'Materials',
        name: 'Material Assignment',
        status: 'WARNING',
        message: 'No named materials detected. Fallback default material will be used.',
      });
    } else {
      checks.push({
        category: 'Materials',
        name: 'Material Assignment',
        status: 'PASS',
        message: `Found ${report.materialNames.length} material(s): ${report.materialNames.slice(0, 4).join(', ')}${report.materialNames.length > 4 ? '...' : ''}`,
      });
    }

    // 4. Orientation & Feature Detection Confidence
    if (report.inferredOrientation.confidence < 0.7) {
      checks.push({
        category: 'Transforms',
        name: 'Orientation Confidence',
        status: 'WARNING',
        message: 'Orientation could not be automatically confirmed with high confidence. Human review required.',
      });
    } else {
      checks.push({
        category: 'Transforms',
        name: 'Orientation Confidence',
        status: 'PASS',
        message: `Orientation confirmed: Forward=${report.inferredOrientation.forward}, Up=${report.inferredOrientation.up} (confidence: ${(report.inferredOrientation.confidence * 100).toFixed(0)}%).`,
      });
    }

    if (report.detectedFeatures.bridge.confidence < 0.7) {
      checks.push({
        category: 'Geometry',
        name: 'Bridge Feature Detection',
        status: 'WARNING',
        message: 'Nose bridge contact region detected with low confidence. Manual calibration recommended.',
      });
    } else {
      checks.push({
        category: 'Geometry',
        name: 'Bridge Feature Detection',
        status: 'PASS',
        message: `Bridge detected at (${report.detectedFeatures.bridge.center.x.toFixed(3)}, ${report.detectedFeatures.bridge.center.y.toFixed(3)}, ${report.detectedFeatures.bridge.center.z.toFixed(3)}) with ${(report.detectedFeatures.bridge.confidence * 100).toFixed(0)}% confidence.`,
      });
    }

    // Calculate Overall Status
    const failures = checks.filter((c) => c.status === 'FAIL').length;
    const warnings = checks.filter((c) => c.status === 'WARNING').length;
    const passes = checks.filter((c) => c.status === 'PASS').length;

    let overallStatus: AssetValidationReport['overallStatus'] = 'PASS';
    if (failures > 0) {
      overallStatus = 'FAIL';
    } else if (warnings > 0) {
      overallStatus = 'REVIEW_REQUIRED';
    }

    return {
      assetId: report.assetId,
      overallStatus,
      checks,
      summary: {
        passes,
        warnings,
        failures,
      },
      validatedAt: new Date().toISOString(),
    };
  }
}

export const defaultAssetValidator = new AssetValidator();
