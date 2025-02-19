/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {util} from '@tensorflow/tfjs-core';

import {getGlobalIndexStringWgsl, getMainHeaderStringWgsl} from '../shader_preprocessor_wgsl';
import {computeDispatch, flatDispatchLayout} from '../webgpu_util';

import {getUseWgsl, WebGPUProgram} from './webgpu_program';

export class ClipProgram implements WebGPUProgram {
  outputShape: number[];
  shaderKey: string;
  variableNames = ['A'];
  uniforms = 'float minVal; float maxVal;';
  uniformsWgsl = 'minVal : f32; maxVal : f32;';
  dispatchLayout: {x: number[]};
  dispatch: [number, number, number];
  workGroupSize: [number, number, number] = [64, 1, 1];
  minVal: number;
  maxVal: number;
  size: number;
  useWgsl: boolean;

  constructor(outputShape: number[]) {
    this.outputShape = outputShape;
    this.dispatchLayout = flatDispatchLayout(this.outputShape);
    this.dispatch = computeDispatch(
        this.dispatchLayout, this.outputShape, this.workGroupSize);

    this.shaderKey = 'clip';
    this.size = util.sizeFromShape(this.outputShape);
    this.useWgsl = getUseWgsl();
  }

  getUserCode(): string {
    const userCode = `
      void main() {
        int index = getGlobalIndex();
        if(index < size) {
          float value = getAAtOutCoords();
          if (isnan(value)) {
            setOutput(index, value);
            return;
          }
          setOutput(index, clamp(value, minVal, maxVal));
        }
      }
    `;
    return userCode;
  }

  getUserCodeWgsl(): string {
    const userCode = `
      ${getMainHeaderStringWgsl(this.workGroupSize)} {
        ${getGlobalIndexStringWgsl(this.workGroupSize)}
        if(index < uniforms.size) {
          let value = getAAtOutCoordsByGlobalId(globalId, index);
          if (isNanCustom(value)) {
            setOutputFlat(index, value);
            return;
          }
          setOutputFlat(index, clamp(value, uniforms.minVal, uniforms.maxVal));
        }
      }
    `;
    return userCode;
  }
}
